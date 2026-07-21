/*
 * Seed script: Creates the PGSQAF framework with 5 criteria,
 * each with indicators, rubrics, evidence, and quantification.
 * Run: node scripts/seed-pgsqaf-framework.js
 */

const FRAMEWORK_PAYLOAD = {
  header: {
    title: "Postgraduate Studies Quality Appraisal Framework (PGSQAF)",
    description:
      "A comprehensive multi-criterion framework for evaluating postgraduate education quality, covering research output, program efficiency, supervision effectiveness, innovation, and research governance. Maximum score = 100. Performance classification: 90-100 Outstanding, 80-89 Excellent, 70-79 Very Good, 60-69 Good, 50-59 Satisfactory, <50 Needs Improvement.",
    version: "1.0",
    status: "PUBLISHED",
  },
  criterias: [
    // ── Criterion 1: Research Output, Quality, and Visibility (25%) ──
    {
      title: "Research Output, Quality, and Visibility",
      domain: "Research Productivity and Quality",
      measure:
        "Assesses volume, quality, and academic visibility of student research",
      indicators: [
        { question: "Publications per student (last 2 years before submission)", weight: "4.17", requireAttachment: false },
        { question: "Proportion in Q1-Q2 journals", weight: "4.17", requireAttachment: false },
        { question: "Citations per publication", weight: "4.17", requireAttachment: false },
        { question: "Conference papers/proceedings", weight: "4.17", requireAttachment: false },
        { question: "Books/book chapters/reports", weight: "4.16", requireAttachment: false },
        { question: "Journal impact metrics (IF, quartile)", weight: "4.16", requireAttachment: false },
      ],
      rubrics: [
        { score: "5", descriptor: "Outstanding", performanceStandard: ">=3 Q1/Q2 papers; >=5 citations/publication" },
        { score: "4", descriptor: "Excellent", performanceStandard: "2 Q1/Q2 papers; >=4 citations" },
        { score: "3", descriptor: "Very Good", performanceStandard: "1 Q1/Q2 paper; >=3 citations" },
        { score: "2", descriptor: "Good", performanceStandard: "1 indexed paper; moderate visibility" },
        { score: "1", descriptor: "Satisfactory", performanceStandard: "Review paper or Q3/Q4 publication" },
      ],
      evidence: [
        { title: "Published articles and conference proceedings", description: "Copies of published journal articles and conference papers", requireAttachment: true },
        { title: "DOI records", description: "Digital Object Identifier records for each publication", requireAttachment: true },
        { title: "Indexing databases (Web of Science / Scopus)", description: "Records from Web of Science or Scopus showing indexed publications", requireAttachment: false },
        { title: "Citation reports (Google Scholar / Scopus / WoS)", description: "Citation count reports from recognised databases", requireAttachment: true },
        { title: "Journal ranking reports", description: "Journal impact factor and quartile ranking documentation", requireAttachment: false },
      ],
      quantification: { assignedScore: "5", weightFactor: "0.25" },
    },

    // ── Criterion 2: Program Efficiency (25%) ──
    {
      title: "Program Efficiency",
      domain: "Timeliness and Completion",
      measure: "Assesses completion rates and operational efficiency",
      indicators: [
        { question: "PhD completion <=4 years (%)", weight: "6.25", requireAttachment: false },
        { question: "MPhil completion rate (%)", weight: "6.25", requireAttachment: false },
        { question: "Thesis evaluation time (months)", weight: "6.25", requireAttachment: false },
        { question: "Attrition rate (%)", weight: "6.25", requireAttachment: false },
      ],
      rubrics: [
        { score: "5", descriptor: "Outstanding", performanceStandard: ">=40% completion within time; low attrition" },
        { score: "4", descriptor: "Excellent", performanceStandard: "41-50% completion within 4 years" },
        { score: "3", descriptor: "Very Good", performanceStandard: "51-60% completion within 5 years" },
        { score: "2", descriptor: "Good", performanceStandard: "61-70% completion within 6 years" },
        { score: "1", descriptor: "Satisfactory", performanceStandard: "71-100% completion; delays within 7 years" },
      ],
      evidence: [
        { title: "Graduation statistics", description: "Annual graduation and completion rate data", requireAttachment: false },
        { title: "Examination records", description: "Thesis examination records and outcomes", requireAttachment: true },
        { title: "Thesis evaluation dates", description: "Timeline records showing thesis submission to evaluation completion", requireAttachment: false },
        { title: "Student enrolment and attrition data", description: "Enrolment figures and attrition/dropout statistics", requireAttachment: false },
      ],
      quantification: { assignedScore: "5", weightFactor: "0.25" },
    },

    // ── Criterion 3: Supervision Effectiveness (20%) ──
    {
      title: "Supervision Effectiveness",
      domain: "Research Supervision Quality",
      measure:
        "Assesses the effectiveness and consistency of supervision",
      indicators: [
        { question: "Meetings per month", weight: "5", requireAttachment: false },
        { question: "Joint publications with students", weight: "5", requireAttachment: false },
        { question: "Student satisfaction (%)", weight: "5", requireAttachment: false },
        { question: "Completion success rate (%)", weight: "5", requireAttachment: false },
      ],
      rubrics: [
        { score: "4", descriptor: "Outstanding", performanceStandard: "Monthly meetings; strong collaboration; high satisfaction" },
        { score: "3", descriptor: "Excellent", performanceStandard: "Regular meetings; consistent support" },
        { score: "2", descriptor: "Good", performanceStandard: "Regular meetings, infrequent support" },
        { score: "1", descriptor: "Satisfactory", performanceStandard: "Infrequent meetings" },
        { score: "0", descriptor: "Unsatisfactory", performanceStandard: "No meeting" },
      ],
      evidence: [
        { title: "Meeting logs", description: "Records of supervisor-student meetings including dates and topics", requireAttachment: true },
        { title: "Student surveys", description: "Student satisfaction survey results", requireAttachment: false },
        { title: "Synopsis approval date", description: "Documentation of synopsis approval timeline", requireAttachment: false },
        { title: "Thesis completion data", description: "Records showing thesis completion under supervision", requireAttachment: false },
      ],
      quantification: { assignedScore: "4", weightFactor: "0.20" },
    },

    // ── Criterion 4: Innovation and Societal Contribution (18%) ──
    {
      title: "Innovation and Societal Contribution",
      domain: "Innovation and Societal Contribution",
      measure: "Assesses the application of research beyond academia",
      indicators: [
        { question: "Patents/IP filings (number)", weight: "3.6", requireAttachment: false },
        { question: "Industry-funded projects (amount/number)", weight: "3.6", requireAttachment: false },
        { question: "Policy contributions (citations/use)", weight: "3.6", requireAttachment: false },
        { question: "Technology transfer outputs", weight: "3.6", requireAttachment: false },
        { question: "Community-based projects", weight: "3.6", requireAttachment: false },
      ],
      rubrics: [
        { score: "5", descriptor: "Outstanding", performanceStandard: "Patents/commercialization; strong industry linkage" },
        { score: "4", descriptor: "Excellent", performanceStandard: "Industry/policy engagement" },
        { score: "3", descriptor: "Very Good", performanceStandard: "Applied research outputs" },
        { score: "2", descriptor: "Good", performanceStandard: "Partial engagement" },
        { score: "1", descriptor: "Satisfactory", performanceStandard: "Limited contribution" },
      ],
      evidence: [
        { title: "Patent submission evidence", description: "Patent application filings and IP registration documents", requireAttachment: true },
        { title: "Industry agreements", description: "Contracts and agreements with industry partners", requireAttachment: true },
        { title: "Policy briefs", description: "Policy documents and briefs citing or utilising research findings", requireAttachment: false },
        { title: "Technology transfer records", description: "Documentation of technology transfer and commercialisation activities", requireAttachment: false },
      ],
      quantification: { assignedScore: "5", weightFactor: "0.18" },
    },

    // ── Criterion 5: Research Governance (12%) ──
    {
      title: "Research Governance",
      domain: "Governance and Compliance",
      measure:
        "Assesses regulatory compliance and administrative efficiency",
      indicators: [
        { question: "Plagiarism compliance (%)", weight: "3", requireAttachment: false },
        { question: "Ethics approvals (timeliness)", weight: "3", requireAttachment: false },
        { question: "Digital tracking system availability", weight: "3", requireAttachment: false },
        { question: "Approval timelines (days)", weight: "3", requireAttachment: false },
      ],
      rubrics: [
        { score: "4", descriptor: "Outstanding", performanceStandard: "Fully efficient system; rapid approvals" },
        { score: "3", descriptor: "Excellent", performanceStandard: "Efficient system; minor delays" },
        { score: "2", descriptor: "Good", performanceStandard: "Moderate efficiency" },
        { score: "1", descriptor: "Satisfactory", performanceStandard: "Frequent delays" },
        { score: "0", descriptor: "Unsatisfactory", performanceStandard: "Weak governance" },
      ],
      evidence: [
        { title: "Plagiarism reports", description: "Turnitin or similar plagiarism check reports", requireAttachment: true },
        { title: "Ethics approval certificates", description: "Institutional review board or ethics committee approval certificates", requireAttachment: true },
        { title: "Digital thesis tracking systems", description: "Evidence of digital systems for thesis tracking and monitoring", requireAttachment: false },
        { title: "Approval timelines", description: "Records showing approval processing times for research proposals and ethics applications", requireAttachment: false },
      ],
      quantification: { assignedScore: "5", weightFactor: "0.12" },
    },
  ],
};

async function main() {
  const API_URL = "http://localhost:3001/api/frameworks";

  console.log("Creating PGSQAF framework...");
  console.log(`  Criteria: ${FRAMEWORK_PAYLOAD.criterias.length}`);
  console.log(
    `  Total indicators: ${FRAMEWORK_PAYLOAD.criterias.reduce((s, c) => s + c.indicators.length, 0)}`
  );
  console.log(
    `  Total rubrics: ${FRAMEWORK_PAYLOAD.criterias.reduce((s, c) => s + c.rubrics.length, 0)}`
  );
  console.log(
    `  Total evidence: ${FRAMEWORK_PAYLOAD.criterias.reduce((s, c) => s + c.evidence.length, 0)}`
  );
  console.log("");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(FRAMEWORK_PAYLOAD),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`Failed (${res.status}):`, data);
      process.exit(1);
    }

    console.log(`Framework created successfully! ID: ${data.id}`);
    console.log(`View at: http://localhost:3001/frameworks/${data.id}`);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
