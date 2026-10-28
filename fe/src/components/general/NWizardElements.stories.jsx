import {
  ActionButton,
  InputField,
  TextAreaField,
  SectionTitle,
  CardPanel,
  RowCard,
} from "./NWizardElements";
import SaveIcon from "@mui/icons-material/Save";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

export default {
  title: "General/NWizardElements",
  tags: ["autodocs"],
};

export const ActionButtonSolid = {
  render: () => (
    <ActionButton icon={<SaveIcon />} onClick={() => alert("Clicked!")}>
      Save Data
    </ActionButton>
  ),
};

export const ActionButtonGhost = {
  render: () => (
    <ActionButton variant="ghost" onClick={() => alert("Clicked!")}>
      Cancel
    </ActionButton>
  ),
};

export const ActionButtonDisabled = {
  render: () => (
    <ActionButton disabled onClick={() => alert("Clicked!")}>
      Disabled
    </ActionButton>
  ),
};

export const InputFieldStory = {
  render: () => (
    <div className="w-96">
      <InputField label="Name" placeholder="Enter your name" />
    </div>
  ),
};

export const TextAreaFieldStory = {
  render: () => (
    <div className="w-96">
      <TextAreaField label="Description" placeholder="Enter description here" />
    </div>
  ),
};

export const SectionTitleStory = {
  render: () => (
    <SectionTitle
      kicker="Step 1"
      title="Basic Information"
      description="Provide the basic information for your experiment."
    />
  ),
};

export const CardPanelStory = {
  render: () => (
    <CardPanel className="w-96">
      <SectionTitle
        kicker="Inside Card"
        title="Settings"
        description="Configure your settings here."
      />
      <div className="mt-4">
        <InputField label="Username" placeholder="Enter username" />
      </div>
    </CardPanel>
  ),
};

export const RowCardStory = {
  render: () => (
    <div className="w-96 flex flex-col gap-4">
      <RowCard
        title="Sample 1"
        subtitle="This is a sample description"
        badge="Ready"
        thumbnail={<ImageOutlinedIcon />}
        onClick={() => {}}
        onDelete={() => {}}
        onMoveLeft={() => {}}
        onMoveRight={() => {}}
      />
      <RowCard
        title="Sample 2 Selected"
        subtitle="This is a selected sample"
        selected
        thumbnail={<ImageOutlinedIcon />}
        onClick={() => {}}
        onDelete={() => {}}
      />
    </div>
  ),
};
