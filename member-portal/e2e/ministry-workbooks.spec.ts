import { test, expect, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url))
  throw Error(
    "Workbook mutation tests require an isolated localhost Supabase project.",
  );
const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
type Fixture = { id: string; email: string; password: string };
const fixtures: Fixture[] = [];
const documentIds: string[] = [],
  unitIds: string[] = [],
  assessmentIds: string[] = [];
function localSql(sql: string) {
  const stack = process.env.MINISTRY_TEST_STACK || "lwm-youth-forms-test";
  if (!/^[a-z0-9-]+-test$/.test(stack)) throw Error("Unsafe fixture stack");
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_" + stack,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: sql, stdio: ["pipe", "pipe", "pipe"] },
  );
}
function checked<
  T extends { data: unknown; error: { message: string } | null },
>(r: T): T["data"] {
  if (r.error) throw Error(r.error.message);
  return r.data;
}
async function fixture(role?: string) {
  const email = `workbook-${randomUUID()}@example.test`,
    password = randomUUID() + "Aa1!";
  const user = checked(
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Workbook acceptance member" },
    }),
  ).user!;
  const value = { id: user.id, email, password };
  fixtures.push(value);
  if (role)
    checked(
      await service.from("user_roles").insert({ user_id: user.id, role }),
    );
  return value;
}
async function login(context: BrowserContext, fixture: Fixture) {
  const cookies: { name: string; value: string }[] = [];
  const auth = createServerClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies,
        setAll: (values: { name: string; value: string }[]) => {
          for (const c of values) {
            const i = cookies.findIndex((x) => x.name === c.name);
            if (i < 0) cookies.push(c);
            else cookies[i] = c;
          }
        },
      },
    },
  );
  checked(
    await auth.auth.signInWithPassword({
      email: fixture.email,
      password: fixture.password,
    }),
  );
  await context.addCookies(
    cookies.map((c) => ({
      ...c,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    })),
  );
}
test.afterAll(async () => {
  if (!fixtures.length) return;
  const ids = fixtures.map((f) => f.id);
  if (ids.some((id) => !/^[0-9a-f-]{36}$/.test(id)))
    throw Error("Invalid fixture identifier");
  const list = ids.map((id) => "'" + id + "'").join(",");
  for (const fixture of fixtures) {
    const files = checked(
      await service.storage
        .from("ministry-curriculum")
        .list(fixture.id + "/library-drafts"),
    ) || [];
    if (files.length)
      checked(
        await service.storage
          .from("ministry-curriculum")
          .remove(files.map((f) => fixture.id + "/library-drafts/" + f.name)),
      );
  }
  const stack = process.env.MINISTRY_TEST_STACK || "lwm-youth-forms-test";
  if (!/^[a-z0-9-]+-test$/.test(stack)) throw Error("Unsafe fixture stack");
  const sql = `begin;
 delete from ministry_private.record_history where record_id in(select id from public.som_records where user_id in(${list}));
 delete from public.som_records where user_id in(${list});
 delete from public.som_grades where work_id in(select id from public.som_work where user_id in(${list}));
 delete from public.som_resources where work_id in(select id from public.som_work where user_id in(${list}));
 delete from public.som_work where user_id in(${list});
 delete from public.som_progress where user_id in(${list});
 delete from public.som_attendance where user_id in(${list});
 delete from public.som_recommendations where user_id in(${list});
 delete from public.som_ledger where enrollment_id in(select id from public.som_enrollments where user_id in(${list}));
 delete from public.som_enrollments where user_id in(${list});
 delete from public.som_instructors where user_id in(${list});commit;`;
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_" + stack,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: sql, stdio: ["pipe", "pipe", "pipe"] },
  );
  for (const f of fixtures) {
    if (unitIds.length || documentIds.length) {
      localSql(
        "begin;" +
          unitIds
            .map(
              (id) =>
                "delete from ministry_private.unit_drafts where unit_id='" +
                id +
                "';delete from ministry_private.unit_content where unit_id='" +
                id +
                "';delete from public.som_units where id='" +
                id +
                "';",
            )
            .join("") +
          assessmentIds
            .map(
              (id) => "delete from public.som_content where id='" + id + "';",
            )
            .join("") +
          documentIds
            .map(
              (id) =>
                "delete from ministry_private.library_versions where document_id='" +
                id +
                "';delete from ministry_private.library_pending_files where document_id='" +
                id +
                "';delete from ministry_private.library_files where document_id='" +
                id +
                "';delete from public.som_library where id='" +
                id +
                "';",
            )
            .join("") +
          "commit;",
      );
      unitIds.length = 0;
      assessmentIds.length = 0;
      documentIds.length = 0;
    }
    checked(await service.auth.admin.deleteUser(f.id));
  }
});
test("browser workbook: actual source questions autosave, submit, return feedback and revise without file uploads", async ({
  browser,
}) => {
  test.setTimeout(360000);
  const admin = await fixture("executive"),
    student = await fixture(),
    teacher = await fixture(),
    other = await fixture();
  const ac = await browser.newContext(),
    sc = await browser.newContext(),
    tc = await browser.newContext(),
    oc = await browser.newContext();
  await login(ac, admin);
  await login(sc, student);
  await login(tc, teacher);
  await login(oc, other);
  const command = async (
    context: BrowserContext,
    action: string,
    payload: Record<string, unknown>,
  ) => {
    const r = await context.request.post("http://127.0.0.1:3017/api/ministry", {
      data: { action, payload },
    });
    expect(r.status(), await r.text()).toBe(200);
    return r.json();
  };
  const e = await command(sc, "request_enrollment", {
    offering_id: "2027-prophets",
    accepted: true,
  });
  const app = await sc.newPage();
  await app.goto("/member/school-of-ministry/application");
  await expect(
    app.getByRole("heading", { name: "Application and orientation" }),
  ).toBeVisible();
  await app.getByRole("textbox").first().fill("Local workbook applicant");
  await app
    .getByRole("button", { name: "Save application draft", exact: true })
    .click();
  await expect(app.getByText("Application draft saved.")).toBeVisible();
  await app.reload();
  await expect(app.getByRole("textbox").first()).toHaveValue(
    "Local workbook applicant",
  );
  await command(ac, "tuition", {
    enrollment_id: e.id,
    semester: "spring",
    kind: "payment",
    cents: -50000,
    description: "Local-only fixture",
  });
  await command(ac, "enrollment", { id: e.id, status: "approved" });
  await command(ac, "instructor", {
    offering_id: "2027-prophets",
    user_id: teacher.id,
  });
  const catalog = await (
    await sc.request.get("http://127.0.0.1:3017/api/ministry/course")
  ).json();
  expect(
    catalog.units.filter(
      (u: { kind: string; offering_id: string }) =>
        u.kind === "chapter" && u.offering_id === "2027-prophets",
    ),
  ).toHaveLength(45);
  expect(
    catalog.units.some((u: { offering_id: string }) =>
      u.offering_id.includes("miracles"),
    ),
  ).toBe(false);
  const unit = await (
    await sc.request.get(
      "http://127.0.0.1:3017/api/ministry/course?unit=2027-prophets-chapter-01",
    )
  ).json();
  expect(unit.fields.length).toBeGreaterThan(10);
  expect(unit.reading).toContain("THE CALL OF THE PROPHET");
  const page = await sc.newPage();
  await page.goto("/member/school-of-ministry/unit/2027-prophets-chapter-01");
  const answer = page.locator("#answer-" + unit.fields[0].id);
  await answer.fill("My own contextual response to the supplied chapter.");
  await expect(
    page.getByText("All responses saved.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(answer).toHaveValue(
    "My own contextual response to the supplied chapter.",
  );
  await page
    .getByRole("button", { name: "Submit assignment", exact: true })
    .click();
  await expect(
    page.getByText("Submitted · Read-only", { exact: true }),
  ).toBeVisible();
  await expect(answer).toBeDisabled();
  let snapshot = await (
    await sc.request.get("http://127.0.0.1:3017/api/ministry")
  ).json();
  const work = snapshot.work.find(
    (w: { assessment_id: string }) => w.assessment_id === unit.assignment_id,
  );
  expect(work.assessment_snapshot.fields[0].label).toBe(unit.fields[0].label);
  const teach = await tc.newPage();
  await teach.goto("/member/school-of-ministry/teach");
  await expect(teach.getByLabel("Submission")).toBeVisible();
  await teach.getByLabel("Submission").selectOption(work.id);
  await expect(
    teach.getByText("My own contextual response to the supplied chapter.", {
      exact: true,
    }),
  ).toBeVisible();
  await teach.getByLabel("Workbook outcome").selectOption("revision_required");
  await teach
    .getByLabel("Instructor feedback", { exact: true })
    .fill("Please relate your response more closely to the passage.");
  await teach.getByLabel("Release feedback to student").check();
  await teach
    .getByRole("button", { name: "Return workbook feedback", exact: true })
    .click();
  await expect(teach.getByText("Saved successfully.").first()).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Revision requested", { exact: true }),
  ).toBeVisible();
  await teach
    .getByRole("button", { name: "Authorize workbook revision", exact: true })
    .click();
  await page.reload();
  await expect(answer).toBeEnabled();
  await answer.fill("Revised response with the passage in context.");
  await expect(
    page.getByText("All responses saved.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Submit assignment", exact: true })
    .click();
  await expect(
    page.getByText("Submitted · Read-only", { exact: true }),
  ).toBeVisible();
  snapshot = await (
    await sc.request.get("http://127.0.0.1:3017/api/ministry")
  ).json();
  expect(
    snapshot.work.filter(
      (w: { assessment_id: string }) => w.assessment_id === unit.assignment_id,
    ),
  ).toHaveLength(2);
  const exported = await (
    await sc.request.get(
      `http://127.0.0.1:3017/api/ministry/export?school=2027-prophets&student=${student.id}`,
    )
  ).json();
  expect(exported.submissions).toHaveLength(2);
  expect(exported.submissions[0].assessment_snapshot.fields[0].label).toBe(
    unit.fields[0].label,
  );
  const withheld = await (
    await sc.request.get(
      "http://127.0.0.1:3017/api/ministry/course?unit=2027-prophets-chapter-31",
    )
  ).json();
  expect(withheld.state).toBe("review_required");
  expect(withheld.fields).toHaveLength(0);
  expect(
    (
      await oc.request.get(
        "http://127.0.0.1:3017/api/ministry/course?unit=2027-prophets-chapter-01",
      )
    ).status(),
  ).toBe(404);
  const doc = catalog.documents.find(
    (d: { category: string }) => d.category === "manual",
  );
  expect(
    (
      await sc.request.get(
        "http://127.0.0.1:3017/api/ministry/library/" + doc.id,
      )
    ).status(),
  ).toBe(200);
  expect(
    (
      await oc.request.get(
        "http://127.0.0.1:3017/api/ministry/library/" + doc.id,
      )
    ).status(),
  ).toBe(404);
  await command(ac, "grant_enrollment", {
    offering_id: "2027-teacher",
    user_id: student.id,
  });
  await page.goto("/member/school-of-ministry/unit/2027-teacher-practicum-01");
  await expect(
    page.getByRole("heading", { name: "Assignment being prepared" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit assignment", exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/member/school-of-ministry/library");
  await expect(page.getByRole("heading", { name: "School library", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chapter workbooks", exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/ministry-workbook-library-mobile.png",
    fullPage: true,
  });
  await ac.close();
  await sc.close();
  await tc.close();
  await oc.close();
});

test("curriculum editor: attach a private document and publish a reviewed workbook draft", async ({
  browser,
}) => {
  const admin = await fixture("executive"),
    context = await browser.newContext();
  await login(context, admin);
  const doc = randomUUID(),
    assessment = randomUUID(),
    unit = "2027-prophets-fixture-" + randomUUID();
  documentIds.push(doc);
  assessmentIds.push(assessment);
  unitIds.push(unit);
  checked(
    await service
      .from("som_library")
      .insert({
        id: doc,
        offering_id: "2027-prophets",
        title: "Local acceptance reference",
        category: "manual",
        audience: "student",
        state: "missing",
        edition: "Isolated test fixture",
        notes: "Not a real course document",
      }),
  );
  localSql(`begin;
 insert into public.som_content(id,offering_id,kind,title,published,data) values('${assessment}','2027-prophets','assignment','Local acceptance workbook',false,'{"unit_id":"${unit}","grading_mode":"completion","max_points":1}');
 insert into public.som_units(id,offering_id,kind,number,title,state,source_version,assignment_id) values('${unit}','2027-prophets','chapter',999,'Local acceptance workbook','review_required','fixture-source','${assessment}');
 insert into ministry_private.unit_content(unit_id,reading,instructions,fields) values('${unit}','Local fixture reading only.','Local fixture guidance only.','[{"id":"fixture-question","label":"Explain this local fixture passage.","type":"written","required":false}]');commit;`);
  const editor = await context.newPage();
  await editor.goto("/member/school-of-ministry/editor");
  await editor
    .getByLabel("School", { exact: true })
    .selectOption("2027-prophets");
  await editor.getByLabel("Library document").selectOption(doc);
  await expect(editor.getByLabel("Attach library file")).toBeVisible();
  await expect(editor.getByLabel("Storage path", { exact: true })).toHaveCount(
    0,
  );
  await editor
    .getByLabel("Attach library file")
    .setInputFiles({
      name: "local-library-reference.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nLocal acceptance reference only.\n%%EOF"),
    });
  await expect(
    editor.getByText(
      "File attached and verified. Preview it before publishing.",
    ),
  ).toBeVisible({ timeout: 30000 });
  const preview = await editor
    .getByRole("link", { name: "Preview attached document" })
    .getAttribute("href");
  expect((await editor.request.get(preview!)).status()).toBe(200);
  await editor
    .getByRole("button", { name: "Publish library document", exact: true })
    .click();
  await expect(
    editor.getByText(
      "Library document published. Chapter text and assignment publication are managed separately.",
    ),
  ).toBeVisible();
  await editor.getByLabel("Learning unit").selectOption(unit);
  await editor
    .getByRole("textbox", { name: "Question 1", exact: true })
    .fill("Explain the revised local fixture passage.");
  await editor
    .getByRole("button", { name: "Save workbook draft", exact: true })
    .click();
  await expect(
    editor.getByText("Draft saved. Preview before publishing."),
  ).toBeVisible();
  await editor
    .getByRole("button", { name: "Preview saved workbook", exact: true })
    .click();
  await editor
    .getByLabel(
      "I have reconciled this workbook section against the controlling manual.",
    )
    .check();
  await editor
    .getByRole("button", { name: "Publish saved workbook", exact: true })
    .click();
  await expect(
    editor.getByText("Workbook published.", { exact: true }),
  ).toBeVisible();
  const published = checked(
    await service.from("som_units").select("state").eq("id", unit).single(),
  );
  expect(published?.state).toBe("available");
  await editor.screenshot({
    path: "test-results/ministry-library-chooser-desktop.png",
    fullPage: true,
  });
  await context.close();
});
