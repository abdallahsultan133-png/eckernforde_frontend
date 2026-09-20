import { useApiQuery } from "@/hooks/use-api-query";
import { schoolDate } from "@/lib/school-time";
const stageLabel = (stage: string) => stage.split("_").map((part) => /^(i|ii|iii|iv|v|vi|vii)$/.test(part) ? part.toUpperCase() : `${part[0]?.toUpperCase()}${part.slice(1)}`).join(" ");
export function AcademicContext() {
  const {data}=useApiQuery<{data:{id:number;name:string;startsOn:string;endsOn:string;academicYear:{name:string}}[]}>("/grades/academic-terms");
  const {data:portal}=useApiQuery<{data:{academicYear:{name:string}|null;context:{stage:string}|null}}>("/portal-context");
  const today=schoolDate(new Date());
  const current=data?.data.filter(term=>term.startsOn<=today && term.endsOn>=today) ?? [];
  if (portal?.data.context && portal.data.academicYear) {
    return <p className="mt-3 text-sm font-medium text-primary">{portal.data.academicYear.name} · {stageLabel(portal.data.context.stage)}</p>;
  }
  if(!current.length && !portal?.data.context) return null;
  return <p className="mt-3 text-sm font-medium text-primary">{current.map(term=>`${term.academicYear.name} · ${term.name}`).join(" / ")}</p>;
}
