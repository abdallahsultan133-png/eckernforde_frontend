import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { BACKEND_BASE_URL } from "@/constants";
import { PublicPageMeta } from "@/components/public/public-page-meta";
import { PublicPageHero } from "@/components/public/public-editorial";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  childStage: string;
  message: string;
  consent: boolean;
  website: string;
};
const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  childStage: "",
  message: "",
  consent: false,
  website: "",
};

export default function AdmissionsPage({
  mode = "enquiry",
}: {
  mode?: "enquiry" | "visit";
}) {
  const title = mode === "visit" ? "Book a visit" : "Admissions";
  const [form, setForm] = useState<FormState>(initialState);
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const update = (field: keyof FormState, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("submitting");
    setError("");
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/admissions/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({})))?.error ??
            "Unable to submit your enquiry."
        );
      setState("success");
      setForm(initialState);
    } catch (submissionError) {
      setState("error");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your enquiry."
      );
    }
  };
  return (
    <>
      <PublicPageMeta
        title={title}
        description="Ask an admissions question and begin a clear, privacy-conscious first conversation with the school."
      />
      <PublicPageHero
        title={title}
        label={mode === "visit" ? "Admissions / Book a visit" : "Admissions"}
        media="admissions-welcome"
        intro="Start with a question. Tell us about your family and the learning stage you are considering. The school will provide current requirements, visit options and next steps."
      />
      <section className="ref-admissions-layout">
        <div className="space-y-8">
          <div className="border-t border-[#172b3a]/20 pt-5">
            <p className="public-eyebrow">How it works</p>
            <ol className="mt-4 space-y-5">
              <li>
                <strong className="font-serif text-2xl">01</strong>
                <p className="mt-1 text-sm leading-6 text-[#172b3a]/75">
                  Send a focused admissions enquiry.
                </p>
              </li>
              <li>
                <strong className="font-serif text-2xl">02</strong>
                <p className="mt-1 text-sm leading-6 text-[#172b3a]/75">
                  Receive verified information directly from the school.
                </p>
              </li>
              <li>
                <strong className="font-serif text-2xl">03</strong>
                <p className="mt-1 text-sm leading-6 text-[#172b3a]/75">
                  Decide whether to arrange a visit or begin the approved
                  application process.
                </p>
              </li>
            </ol>
          </div>
          <div className="border-t border-[#172b3a]/20 pt-5">
            <ShieldCheck
              className="h-6 w-6 text-[#ba4a32]"
              aria-hidden="true"
            />
            <h2 className="mt-3 font-serif text-2xl">
              Share only what is needed.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#172b3a]/75">
              Please do not include child identity documents, dates of birth,
              health information, payment details or portal passwords in this
              form.
            </p>
          </div>
        </div>
        <form
          id="admissions-enquiry"
          className="ref-admissions-form"
          onSubmit={submit}
          aria-describedby={state === "error" ? "enquiry-error" : undefined}
        >
          <h2 className="font-serif text-3xl">
            {mode === "visit"
              ? "Request a visit conversation"
              : "Admissions enquiry"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#172b3a]/70">
            Fields marked * are required.
          </p>
          {state === "success" ? (
            <div
              className="mt-6 border border-emerald-700/25 bg-emerald-50 p-5 text-emerald-950"
              role="status"
            >
              <CheckCircle2 className="mb-2 h-6 w-6" aria-hidden="true" />
              <p className="font-semibold">Your enquiry has been received.</p>
              <p className="mt-1 text-sm">
                The school can now respond using the contact details you
                provided.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              <label className="grid gap-2 text-sm font-semibold">
                Your name *
                <input
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className="min-h-11 border border-[#172b3a]/30 bg-white px-3 font-normal outline-none focus:border-[#ba4a32] focus:ring-2 focus:ring-[#ba4a32]/30"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Email address *
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="min-h-11 border border-[#172b3a]/30 bg-white px-3 font-normal outline-none focus:border-[#ba4a32] focus:ring-2 focus:ring-[#ba4a32]/30"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Phone number{" "}
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="min-h-11 border border-[#172b3a]/30 bg-white px-3 font-normal outline-none focus:border-[#ba4a32] focus:ring-2 focus:ring-[#ba4a32]/30"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Stage you are considering *
                <select
                  required
                  value={form.childStage}
                  onChange={(e) => update("childStage", e.target.value)}
                  className="min-h-11 border border-[#172b3a]/30 bg-white px-3 font-normal outline-none focus:border-[#ba4a32] focus:ring-2 focus:ring-[#ba4a32]/30"
                >
                  <option value="" disabled>
                    Select a stage
                  </option>
                  <option value="nursery">Nursery</option>
                  <option value="kindergarten">Kindergarten</option>
                  <option value="primary">Primary — Standard I–VI</option>
                  <option value="secondary">Secondary — Form I–IV</option>
                  <option value="not_sure">I’m not sure yet</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Question or context{" "}
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  className="border border-[#172b3a]/30 bg-white p-3 font-normal outline-none focus:border-[#ba4a32] focus:ring-2 focus:ring-[#ba4a32]/30"
                />
              </label>
              <label className="flex items-start gap-3 text-sm leading-5">
                <input
                  required
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#ba4a32]"
                />
                <span>
                  I agree that the school may use these details to respond to
                  this admissions enquiry. *
                </span>
              </label>
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                name="website"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
              {state === "error" && (
                <p
                  id="enquiry-error"
                  role="alert"
                  className="text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              <button
                disabled={state === "submitting"}
                className="public-primary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
              >
                {state === "submitting" && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Send enquiry
              </button>
            </div>
          )}
        </form>
      </section>
      <section className="ref-admissions-faq" aria-labelledby="admissions-faq">
        <div className="border-t border-[#172b3a]/20 pt-5">
          <p className="public-eyebrow" id="admissions-faq">
            Frequently asked questions
          </p>
        </div>
        <div className="ref-faq-list">
          {[
            [
              "What happens after I enquire?",
              "The admissions team reviews your question and replies using the contact details you provide.",
            ],
            [
              "Can I visit the school?",
              "Visit availability, dates and safeguarding arrangements are confirmed directly by the school.",
            ],
            [
              "Where are requirements listed?",
              "The school will provide current, verified entry requirements for the stage you select.",
            ],
          ].map(([question, answer]) => (
            <details key={question} className="ref-faq-item">
              <summary className="cursor-pointer font-serif text-xl">
                {question}
              </summary>
              <p className="mt-4 text-sm leading-6 text-[#172b3a]/75">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
