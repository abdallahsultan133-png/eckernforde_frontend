import { useId, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Link } from "react-router";
import { ArrowUpRight, Award, BookOpenCheck, GraduationCap, Target } from "lucide-react";
import type { User } from "@/types";
import { useApiQuery } from "@/hooks/use-api-query";
import { letterForScore } from "@/lib/grading/grade-bands";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

type Term = { id: number; name: string; type: string; academicYear: { name: string } };
type Result = { id: number; score: number; schoolLevel: string; applicable: boolean; subject: { name: string }; class: { name: string } };

function performanceLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Strong";
  if (score >= 50) return "On track";
  return "Needs focus";
}

function performanceTone(score: number) {
  if (score >= 80) return "excellent";
  if (score >= 65) return "strong";
  if (score >= 50) return "steady";
  return "focus";
}

export function AcademicProgress({ studentId }: { studentId?: string }) {
  const { data: identity } = useGetIdentity<User>();
  const { data: terms, isLoading: loadingTerms, isError: termsError, refetch: retryTerms } = useApiQuery<{ data: Term[] }>("/grades/academic-terms");
  const [selection, setSelection] = useState("");
  const term = terms?.data.find((item) => String(item.id) === selection) ?? terms?.data[0];
  const id = studentId ?? identity?.id;
  const labelId = useId();
  const { data, isLoading, isError, refetch } = useApiQuery<{ data: Result[]; division: { division: string | null; totalPoints: number | null } | null }>(id && term ? `/grades/term-results/${id}?academicTermId=${term.id}` : null);

  if (loadingTerms) return <Skeleton className="h-72 w-full" />;
  if (termsError) return <ErrorState description="Unable to load academic terms." onRetry={retryTerms} />;
  if (!term) return <p className="text-sm text-muted-foreground">No academic terms recorded yet.</p>;

  const results = data?.data.filter((result) => result.applicable) ?? [];
  const average = results.length ? Math.round(results.reduce((total, result) => total + result.score, 0) / results.length) : null;
  const bestResult = results.reduce<Result | undefined>((best, result) => !best || result.score > best.score ? result : best, undefined);
  const focusResult = results.reduce<Result | undefined>((lowest, result) => !lowest || result.score < lowest.score ? result : lowest, undefined);

  return <div className="academic-progress">
    <div className="academic-progress__toolbar">
      <div><p className="academic-progress__eyebrow">Published assessment</p><p className="academic-progress__term">{term.academicYear.name} <span aria-hidden="true">·</span> {term.name}</p></div>
      <label className="academic-progress__selector" htmlFor={labelId}><span className="sr-only">Academic period</span><select id={labelId} value={term.id} onChange={(event) => setSelection(event.target.value)}>{terms?.data.map((item) => <option key={item.id} value={item.id}>{item.academicYear.name} · {item.name} · {item.type}</option>)}</select></label>
    </div>
    {isLoading ? <Skeleton className="mt-4 h-56 w-full" /> : isError ? <ErrorState description="Unable to load published results." onRetry={refetch} /> : !results.length ? <div className="academic-progress__empty"><BookOpenCheck aria-hidden="true" /><p><strong>No published results yet</strong><span>Your teachers’ assessments will appear here once they are released for this period.</span></p></div> : <>
      <div className="academic-progress__hero">
        <div className="academic-progress__average"><span>Term average</span><strong>{average}%</strong><small>{performanceLabel(average ?? 0)}</small></div>
        <dl className="academic-progress__stats">
          <div><dt><BookOpenCheck aria-hidden="true" />Subjects assessed</dt><dd>{results.length}</dd></div>
          <div><dt><Award aria-hidden="true" />Highest result</dt><dd>{bestResult?.score}% <small>{bestResult?.subject.name}</small></dd></div>
          {data?.division?.division ? <div><dt><GraduationCap aria-hidden="true" />Term division</dt><dd>Division {data.division.division}<small>{data.division.totalPoints} points</small></dd></div> : <div><dt><Target aria-hidden="true" />Focus area</dt><dd>{focusResult?.score}% <small>{focusResult?.subject.name}</small></dd></div>}
        </dl>
      </div>
      <div className="academic-progress__subjects" aria-label="Subject performance">
        <div className="academic-progress__subjects-heading"><span>Subject performance</span><span>Score</span></div>
        {results.slice(0, 6).map((result) => { const tone = performanceTone(result.score); return <div className="academic-progress__subject" key={result.id}><div className="academic-progress__subject-name"><strong>{result.subject.name}</strong><span>{result.class.name} · {performanceLabel(result.score)}</span></div><div className="academic-progress__meter" aria-hidden="true"><i className={`academic-progress__meter-fill academic-progress__meter-fill--${tone}`} style={{ width: `${Math.max(0, Math.min(100, result.score))}%` }} /></div><div className="academic-progress__score"><strong>{result.score}%</strong>{result.schoolLevel === "secondary" && <span>{letterForScore(result.score)}</span>}</div></div>; })}
      </div>
    </>}
    <Link to="/grades/term-results" className="academic-progress__link">View detailed term report <ArrowUpRight aria-hidden="true" /></Link>
  </div>;
}
