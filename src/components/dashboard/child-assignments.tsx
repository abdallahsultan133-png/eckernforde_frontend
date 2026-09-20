import { useId, useState } from "react";
import { UpcomingAssignments } from "./upcoming-assignments";
export function ChildAssignments({ classes }: { classes:{id:number;name:string;subject?:{id:number|null;name:string|null}|null}[] }) {
  const [selected,setSelected]=useState("");
  const subjects = Array.from(new Map(classes.filter((item) => item.subject?.id && item.subject.name).map((item) => [String(item.subject!.id), item.subject!.name!])).entries()).map(([id, name]) => ({ id, name }));
  const currentSubject = subjects.find((item) => item.id === selected) ?? subjects[0];
  const current = classes.find((item) => String(item.subject?.id) === currentSubject?.id) ?? classes[0];
  const id=useId();
  if(!current) return <p className="text-sm text-muted-foreground">No subjects recorded for this child.</p>;
  return <div><label htmlFor={id} className="block text-xs mb-2">Assignments for subject</label>
    <select id={id} value={currentSubject?.id ?? ""} onChange={e=>setSelected(e.target.value)} className="w-full min-h-11 border rounded p-2 bg-card mb-4 text-sm">
      {subjects.length > 0 ? subjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>) : <option value={String(current.id)}>{current.name}</option>}
    </select><UpcomingAssignments key={currentSubject?.id ?? current.id} subjectId={currentSubject ? Number(currentSubject.id) : undefined} classId={currentSubject ? undefined : current.id} max={4} />
  </div>;
}
