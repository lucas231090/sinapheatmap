import Card from "./Card";

export default {
  title: "General/Card",
  component: Card,
  tags: ["autodocs"],
};

export const Default = {
  render: () => (
    <div className="w-96 bg-gray-100 p-4">
      <Card>
        <h3 className="text-lg font-bold">Card Title</h3>
        <p>Card Content goes here.</p>
      </Card>
    </div>
  ),
};
