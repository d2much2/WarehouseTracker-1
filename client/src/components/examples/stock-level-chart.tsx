import { StockLevelChart } from "../stock-level-chart";

export default function StockLevelChartExample() {
  const chartData = [
    { date: "Jan", stock: 12400 },
    { date: "Feb", stock: 13200 },
    { date: "Mar", stock: 11800 },
    { date: "Apr", stock: 14500 },
    { date: "May", stock: 13900 },
    { date: "Jun", stock: 15200 },
  ];

  return (
    <div className="p-8">
      <StockLevelChart data={chartData} />
    </div>
  );
}
