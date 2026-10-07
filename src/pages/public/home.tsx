import { ReferenceOpening, ReferenceIdentity, ReferenceCampus, ReferenceMosaic, ReferenceStages } from "@/components/public/home/reference-home";

export default function PublicHome() {
  return (
    <div className="reference-home">
      <ReferenceOpening />
      <ReferenceIdentity />
      <ReferenceCampus />
      <ReferenceMosaic />
      <ReferenceStages />
    </div>
  );
}
