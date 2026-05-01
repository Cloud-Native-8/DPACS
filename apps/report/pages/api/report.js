import { getReportData } from "../../src/lib/report-data.js";

export default async function handler(_req, res) {
  try {
    const report = await getReportData();

    res.status(200).json({
      service: "report",
      route: "/api/report",
      data: report
    });
  } catch (error) {
    res.status(500).json({
      service: "report",
      route: "/api/report",
      error: error.message
    });
  }
}
