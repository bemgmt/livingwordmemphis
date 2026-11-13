"""Read supplied ZIP/DOCX originals into a PRIVATE, repeatable import bundle.
Run with the bundled Python runtime. Never place output in public/ or commit it.
"""
import argparse,hashlib,io,json,re,sys,uuid,zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding="utf-8")
parser=argparse.ArgumentParser()
parser.add_argument("--source-root",type=Path,required=True)
parser.add_argument("--output",type=Path,required=True)
args=parser.parse_args()
args.output.mkdir(parents=True,exist_ok=True)
(args.output/"files").mkdir(exist_ok=True)
allowed=("apostles","prophets","evangelist","pastor","teacher")
ns={"w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
small=dict(zip("ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN TWELVE THIRTEEN FOURTEEN FIFTEEN SIXTEEN SEVENTEEN EIGHTEEN NINETEEN".split(),range(1,20)))
small.update(TWENTY=20,THIRTY=30,FORTY=40)
namespace=uuid.UUID("d8f62762-0c5d-47dc-ae2e-121220270045")
def uid(key):return str(uuid.uuid5(namespace,key))
def school(name):
    lower=name.lower()
    return next((s for s in allowed if "school_of_the_"+s in lower),None)
def paragraphs(raw):
    doc=ET.fromstring(zipfile.ZipFile(io.BytesIO(raw)).read("word/document.xml"))
    lines=[];headings=set()
    for p in doc.findall(".//w:body//w:p",ns):
        t="".join(x.text or "" for x in p.findall(".//w:t",ns)).strip()
        if not t:continue
        lines.append(t)
        style=p.find("./w:pPr/w:pStyle",ns)
        if style is not None and ("heading" in style.get("{"+ns["w"]+"}val","").lower() or style.get("{"+ns["w"]+"}val","") in ("Title","Subtitle")):headings.add(t)
    return lines,headings
sources={}
def visit(name,raw):
    ext=Path(name).suffix.lower()
    if ext==".zip":
        z=zipfile.ZipFile(io.BytesIO(raw))
        for m in z.infolist():
            if not m.is_dir() and m.file_size<100_000_000:visit(name+"!"+m.filename,z.read(m))
        return
    if ext not in (".docx",".pdf") or not school(name) or "miracles" in name.lower():return
    sha=hashlib.sha256(raw).hexdigest()
    if sha in sources:sources[sha]["aliases"].append(name);return
    filename=name.split("!")[-1].split("/")[-1]
    lines,headings=paragraphs(raw) if ext==".docx" else ([],set())
    sources[sha]={"school":school(name),"filename":filename,"sha":sha,"raw":raw,"lines":lines,"headings":headings,"aliases":[name],"ext":ext}
archive_root=args.source_root/"alldownloads"
if not archive_root.is_dir():raise SystemExit("Expected the reviewed alldownloads folder.")
for p in sorted(archive_root.glob("*.zip")):visit(p.name,p.read_bytes())
if not sources:raise SystemExit("No five-school source documents found.")
def chapters(lines):
    starts=[]
    for i,line in enumerate(lines):
        m=re.fullmatch(r"CHAPTER\s+([A-Z -]+|\d+)(?: WORKBOOK)?",line)
        if not m:continue
        text=m[1].removesuffix(" WORKBOOK").strip()
        try:n=int(text) if text.isdigit() else sum(small[w] for w in re.split("[ -]+",text))
        except (ValueError,KeyError):continue
        if 1<=n<=45:starts.append((i,n))
    blocks={}
    for j,(start,n) in enumerate(starts):
        end=starts[j+1][0] if j+1<len(starts) else len(lines)
        for k in range(start+2,end):
            if re.match(r"^(FINAL WORKBOOK SYNTHESIS|PASTORAL MINISTRY PRACTICUM RECORD|FINAL STUDENT FORMATION REVIEW|FINAL STUDENT COVENANT)$",lines[k]):end=k;break
        blocks[n]=lines[start:end]
    return blocks
blank=lambda s:bool(re.fullmatch(r"[\s_\.\u2026]+",s)) and "_" in s
def fields(lines,prefix,headings=(),application=False):
    result=[];section="Workbook responses";seen=set()
    for i,line in enumerate(lines):
        if blank(line):continue
        if not application and re.match(r"^(Instructor Review|Instructor Comments|Reviewed by|Instructor initials|Instructor signature)",line,re.I):break
        if line in headings and not re.match(r"^CHAPTER",line):
            section=line
        next_blank=i+1<len(lines) and blank(lines[i+1])
        inline_blank="_" in line and len(re.sub("_","",line).strip())>3
        special=re.match(r"^(Understanding question|Application assignment):",line)
        is_question=next_blank or inline_blank or line.endswith("?") or special
        if not is_question or line in headings or len(line)<4:continue
        if not application and re.match(r"^(Student|Name|Date|Supervisor|Instructor|Reviewed|Signature|Completed reading)",line,re.I):continue
        label=re.sub(r"_{2,}"," ",line).strip()
        label=re.sub(r"\s{2,}"," ",label)
        if label in seen or len(label)>3000:continue
        seen.add(label)
        key=prefix+"-"+hashlib.sha256((section+"|"+label).encode()).hexdigest()[:12]
        result.append({"id":key,"label":label,"section":section,"type":"short" if inline_blank and len(label)<100 else "written","required":False})
    return result
def readable(lines):
    return "\n\n".join(re.sub("_{2,}","",line).strip() for line in lines if not blank(line) and not re.match(r"^(Instructor initials|Reviewed by|Student initials|Instructor comments:)",line,re.I))
documents=[];private_files=[];units=[];content=[];bodies=[];issues=[]
for source in sources.values():
    name=source["filename"].lower();s=source["school"]
    category=("forms" if "admissions_" in name else "instructor" if "instructor_handbook" in name else "handbook" if "catalog" in name else "graduation" if "graduation_" in name else "manual" if "student_manual" in name else "weekly" if "assignment_workbook" in name else "workbook")
    key=f"{s}:{category}"+(":pdf" if source["ext"]==".pdf" else "")
    document=uid(key);source["document_id"]=document;source["category"]=category
    state="review_required" if s=="prophets" and category=="workbook" else "available"
    audience="admin" if category in ("forms","graduation") else "instructor" if category=="instructor" else "applicant" if category=="handbook" else "student"
    title={"forms":"Admissions and administrative forms","instructor":"Instructor handbook","handbook":"Student handbook and catalog","graduation":"Graduation and certificate package","manual":"Student manual","weekly":"2027 weekly assignment workbook","workbook":"Student workbook"}[category]
    if source["ext"]==".pdf":title+=" · PDF edition"
    documents.append({"id":document,"offering_id":"2027-"+s,"title":title,"category":category,"audience":audience,"state":state,"edition":"Supplied publication master","notes":"Eight chapter sections require reconciliation with the controlling manual; released weekly assignments are available." if state=="review_required" else "Optional reference. Written assignments are completed on the site." if category in ("manual","workbook","weekly") else "Supplied school document.","source_hash":source["sha"],"filename":source["filename"]})
    path="library/"+s+"/"+source["sha"]+source["ext"]
    local="files/"+source["sha"]+source["ext"]
    (args.output/local).write_bytes(source["raw"])
    private_files.append({"document_id":document,"bucket":"ministry-curriculum","path":path,"mime":"application/pdf" if source["ext"]==".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document","size":len(source["raw"]),"ready":True,"local_file":local})
def placeholder(s,category,title,notes,audience="student"):
    if any(d["offering_id"]=="2027-"+s and d["category"]==category for d in documents):return
    documents.append({"id":uid(f"{s}:{category}"),"offering_id":"2027-"+s,"title":title,"category":category,"audience":audience,"state":"missing","edition":"Awaiting source material","notes":notes,"source_hash":None,"filename":None})
def add_unit(s,kind,n,title,source,lines,reading="",state="available",notes="",meeting=None,assigned=None,custom_fields=None):
    key=f"2027-{s}-{kind}-{n:02d}" if kind!="application" else f"2027-{s}-application" if n==1 else f"2027-{s}-form-{n:02d}"
    qs=custom_fields if custom_fields is not None else fields(lines,f"{kind[0]}{n:02d}",source["headings"],kind=="application")
    assignment=uid(key+":assignment") if kind!="application" else None
    units.append({"id":key,"offering_id":"2027-"+s,"kind":kind,"number":n,"title":title,"state":state,"source_document_id":source["document_id"],"source_version":source["sha"],"assignment_id":assignment,"meeting_id":meeting,"chapters":assigned if assigned is not None else [n] if kind=="chapter" else [],"notes":notes})
    bodies.append({"unit_id":key,"reading":reading,"instructions":readable(lines),"fields":qs,"source_sections":{"source_filename":source["filename"],"source_chapter_title":lines[1] if len(lines)>1 else title}})
    if assignment:
        data={"unit_id":key,"grading_mode":"completion","max_points":1,"chapters":units[-1]["chapters"],"body":"Complete the supplied workbook responses directly on the site."}
        if meeting:data["meeting_id"]=meeting;data["semester"]="spring" if meeting<"2027-08-01" else "fall"
        content.append({"id":assignment,"offering_id":"2027-"+s,"kind":"assignment","title":title,"data":data,"published":state=="available"})
    if state=="available" and kind!="application" and not qs:raise ValueError(f"No questions detected for {key}")
for s in allowed:
    workbook=next(x for x in sources.values() if x["school"]==s and x["category"]=="workbook" and x["ext"]==".docx")
    blocks=chapters(workbook["lines"])
    if sorted(blocks)!=list(range(1,46)):raise ValueError(f"{s} does not have exactly 45 workbook chapters")
    manual=next((x for x in sources.values() if x["school"]==s and x["category"]=="manual"),None)
    manual_blocks=chapters(manual["lines"]) if manual else {}
    for n,block in sorted(blocks.items()):
        canonical_title=manual_blocks.get(n,block)[1]
        mismatch=bool(manual and re.sub("[^a-z0-9]","",canonical_title.lower())!=re.sub("[^a-z0-9]","",block[1].lower()))
        if mismatch:issues.append({"school":s,"chapter":n,"manual_title":canonical_title,"workbook_title":block[1]})
        add_unit(s,"chapter",n,f"Chapter {n} · {canonical_title}",workbook,block,readable(manual_blocks.get(n,[])),
          "review_required" if mismatch else "available",
          "Workbook title differs from the controlling manual. Questions remain withheld pending reconciliation." if mismatch else "Full student manual not supplied. Workbook responses are available." if not manual else "")
    placeholder(s,"manual","Student manual — being prepared","The complete teaching manual referenced by this workbook has not been supplied.")
    placeholder(s,"exams","Examinations — being prepared","Actual exam papers, answer keys, and approved scoring guides have not been supplied. No exam attempts or invented questions are created.")
    placeholder(s,"practicum","Practicum instructions — being prepared","Detailed supervised activity instructions and assessment guides have not been supplied. Workbook practice/reflection prompts remain available where provided.")
    placeholder(s,"instructor","Instructor manual — being prepared","A school-specific instructor manual has not been supplied.","instructor")
    placeholder(s,"handbook","Student handbook — being prepared","A school-specific student handbook has not been supplied. The published program schedule and tuition remain available.","applicant")
    placeholder(s,"graduation","Graduation package — being prepared","The separate school graduation and certification package has not been supplied. Existing administrative forms remain available.","admin")
    form=next(x for x in sources.values() if x["school"]==s and x["category"]=="forms")
    expected="B" if s=="apostles" else "1"
    start=next(i for i,l in enumerate(form["lines"]) if re.match(r"^FORM\s+"+expected+r"\b",l,re.I))
    end=next((i for i in range(start+1,len(form["lines"])) if re.match(r"^FORM\s+(?:[A-Z]|\d+)\b",form["lines"][i],re.I)),len(form["lines"]))
    # Some forms repeat their index before the actual body; use the final matching heading.
    starts=[i for i,l in enumerate(form["lines"]) if re.match(r"^FORM\s+"+expected+r"\b",l,re.I)]
    start=starts[-1];end=next((i for i in range(start+1,len(form["lines"])) if re.match(r"^FORM\s+(?:[A-Z]|\d+)\b",form["lines"][i],re.I)),len(form["lines"]))
    add_unit(s,"application",1,"School admission application",form,form["lines"][start:end])
    form_starts=[i for i,l in enumerate(form["lines"]) if re.match(r"^FORM\s+(?:[A-Z]|\d+)\b",l,re.I)]
    extra=2;seen_titles=set()
    for j,form_start in enumerate(form_starts):
        title=form["lines"][form_start]
        if title in seen_titles:continue
        # Select the final occurrence so a forms index is never used as a template.
        if any(form["lines"][later]==title for later in form_starts[j+1:]):continue
        seen_titles.add(title)
        if not re.search(r"inquiry|interest form|student concern|grievance|complaint|withdrawal|leave|return.to.study|records.*(?:correction|release)|certificate.*request|transcript.*request",title,re.I):continue
        block=form["lines"][form_start:form_starts[j+1] if j+1<len(form_starts) else len(form["lines"])]
        qs=fields(block,f"form{extra}",form["headings"],True)
        qs=[q for q in qs if not re.match(r"^(Instructor|Director|Reviewer|Decision|Approved|Staff|Authorized|School Representative|Office Use)",q["label"],re.I)]
        if not qs:continue
        add_unit(s,"application",extra,title,form,block,custom_fields=qs)
        bodies[-1]["source_sections"]["record_kind"]="concern" if re.search(r"concern|grievance|complaint",title,re.I) else "request"
        extra+=1
weekly=next(x for x in sources.values() if x["category"]=="weekly")
starts=[i for i,l in enumerate(weekly["lines"]) if re.match(r"^(Spring|Fall) Week \d+",l)]
months={"Jan":1,"Feb":2,"Mar":3,"Apr":4,"Aug":8,"Sep":9,"Oct":10,"Nov":11}
for index,start in enumerate(starts):
    block=weekly["lines"][start:starts[index+1] if index+1<len(starts) else len(weekly["lines"])]
    for j,l in enumerate(block[1:],1):
        if l in ("Spring semester review","Fall semester review"):block=block[:j];break
    date=re.search(r"— (\w+) (\d+):",block[0]);meeting=f"2027-{months[date[1]]:02d}-{int(date[2]):02d}"
    chapter=re.search(r"Assigned chapters:\s*(\d+)(?:[–-](\d+))?",block[1]);assigned=list(range(int(chapter[1]),int(chapter[2] or chapter[1])+1))
    add_unit("prophets","week",index+1,block[0],weekly,block,meeting=meeting,assigned=assigned)
portfolio_start=weekly["lines"].index("Final portfolio checklist")
portfolio_lines=weekly["lines"][portfolio_start:]
add_unit("prophets","portfolio",1,"Final portfolio reflection and six-month service plan",weekly,portfolio_lines,
 custom_fields=[{"id":"portfolio-reflection","label":"Submit final portfolio reflection and a six-month service plan.","section":"Final portfolio","type":"written","required":False}])
pastor=next(x for x in sources.values() if x["school"]=="pastor" and x["category"]=="workbook" and x["ext"]==".docx")
starts=[i for i,l in enumerate(pastor["lines"]) if re.match(r"^Practicum \d+ [—–-]",l)]
for index,start in enumerate(starts):
    block=pastor["lines"][start:starts[index+1] if index+1<len(starts) else len(pastor["lines"])]
    for j,l in enumerate(block[1:],1):
        if l=="FINAL STUDENT FORMATION REVIEW":block=block[:j];break
    add_unit("pastor","practicum",index+1,block[0],pastor,block,
      notes="Supplied supervised-practice reflection record only. The instructor provides the activity instructions and supervision; completion records participation, not independent ministry competence.")
teacher=next(x for x in sources.values() if x["school"]=="teacher" and x["category"]=="workbook")
for n in range(1,15):
    add_unit("teacher","practicum",n,f"Teaching practicum {n} — materials being prepared",teacher,[],state="missing",
      notes="The handbook requires this supervised practicum, but the activity instructions and detailed evaluation criteria have not been supplied.")
add_unit("teacher","portfolio",1,"Capstone teaching demonstration — materials being prepared",teacher,[],state="missing",
 notes="The required demonstration instructions and assessment criteria have not been supplied.")
bundle={"schema_version":1,"schools":list(allowed),"documents":documents,"files":private_files,"units":units,"bodies":bodies,"assignments":content,"reconciliation":issues,
 "sources":[{"filename":s["filename"],"sha256":s["sha"],"aliases":s["aliases"]} for s in sources.values()]}
(args.output/"bundle.json").write_text(json.dumps(bundle,ensure_ascii=False),encoding="utf8")
summary={"schools":list(allowed),"unique_source_files":len(sources),"chapter_units":sum(u["kind"]=="chapter" for u in units),"weekly_assignments":sum(u["kind"]=="week" for u in units),"available_assignments":sum(a["published"] for a in content),"held_chapters":[i["chapter"] for i in issues],"missing_documents":sum(d["state"]=="missing" for d in documents),"structured_questions":sum(len(b["fields"]) for b in bodies)}
(args.output/"preview.json").write_text(json.dumps(summary,indent=2),encoding="utf8")
print(json.dumps(summary))
