const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFile } = require("node:fs/promises");
const { stripTypeScriptTypes } = require("node:module");
const vm = require("node:vm");

// Execute the actual route and middleware with isolated service doubles.
async function loadModule(path, imports) {
  const source = stripTypeScriptTypes(await readFile(path, "utf8"));
  const context = vm.createContext({ Response, process: { env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-server-only-key",
  } } });
  const module = new vm.SourceTextModule(source, { context });
  await module.link(async name => {
    const values = imports[name];
    assert.ok(values, `Unexpected dependency: ${name}`);
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

test("logged-out curriculum requests pass while upload and member pages redirect", async () => {
  const response = new Response(null, { status: 200 });
  const { middleware } = await loadModule("middleware.ts", {
    "next/server": { NextResponse: { redirect: url => new Response(null, { status: 307, headers: { Location: url.href } }) } },
    "@/lib/supabase/middleware": { updateSession: async () => ({ response, user: null }) },
  });
  for (const [path, status] of [
    ["/member/sunday-school", 200],
    ["/member/sunday-school/upload", 307],
    ["/member/dashboard", 307],
    ["/admin", 307],
    ["/api/sunday-school/resources/lesson", 200],
  ]) {
    const url = new URL(path, "https://example.com");
    url.clone = () => new URL(url);
    assert.equal((await middleware({ nextUrl: url })).status, status, path);
  }
});

test("unauthenticated download signs only a published lesson file", async () => {
  let file = { storagePath: "teacher/lesson.pdf", originalFilename: "lesson.pdf" };
  let fetched = 0;
  let signed = 0;
  let storageError = false;
  const { GET } = await loadModule("app/api/sunday-school/resources/[documentId]/route.ts", {
    "@supabase/supabase-js": { createClient: (url, key, options) => {
      assert.equal(key, "test-server-only-key");
      assert.equal(options.auth.persistSession, false);
      return { storage: { from: bucket => {
        assert.equal(bucket, "sunday-school-curriculum");
        return { createSignedUrl: async (path, ttl, options) => {
          signed++;
          assert.equal(path, "teacher/lesson.pdf");
          assert.equal(ttl, 60);
          assert.equal(options.download, "lesson.pdf");
          return storageError ? { data: null, error: new Error("offline") } : { data: { signedUrl: "https://example.supabase.co/signed-file" }, error: null };
        } };
      } } };
    } },
    "@/lib/sanity/client": { sanityWriteClient: { fetch: async (query, params, options) => {
      fetched++;
      assert.match(query, /!\(_id in path\("drafts\.\*\*"\)\)/);
      assert.equal(options.perspective, "published");
      assert.equal(params.id, "lesson");
      return file;
    } } },
    "@/lib/sunday-school": { SUNDAY_SCHOOL_BUCKET: "sunday-school-curriculum" },
  });
  const request = id => GET(new Request("https://example.com"), { params: Promise.resolve({ documentId: id }) });
  const result = await request("lesson");
  assert.equal(result.status, 302);
  assert.equal(result.headers.get("location"), "https://example.supabase.co/signed-file");
  assert.equal(result.headers.get("cache-control"), "private, no-store");
  assert.equal((await request("drafts.lesson")).status, 404);
  assert.equal((await request("../lesson")).status, 404);
  assert.equal(fetched, 1);
  assert.equal(signed, 1);
  file = null;
  assert.equal((await request("lesson")).status, 404);
  file = { storagePath: "../private.pdf" };
  assert.equal((await request("lesson")).status, 404);
  assert.equal(signed, 1);
  file = { storagePath: "teacher/lesson.pdf", originalFilename: "lesson.pdf" };
  storageError = true;
  assert.equal((await request("lesson")).status, 503);
});
