/*
 * Seed script: Creates the PGSQAF framework directly in the database.
 * Run: node scripts/seed-pgsqaf-db.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 5,
});

const FRAMEWORK = {
  title: "Postgraduate Studies Quality Appraisal Framework (PGSQAF)",
  description:
    "A comprehensive multi-criterion framework for evaluating postgraduate education quality, covering research output, program efficiency, supervision effectiveness, innovation, and research governance. Maximum score = 100. Performance classification: 90-100 Outstanding, 80-89 Excellent, 70-79 Very Good, 60-69 Good, 50-59 Satisfactory, <50 Needs Improvement.",
  version: "1.0",
  status: "PUBLISHED",
};

const CRITERIAS = [
  {
    title: "Research Output, Quality, and Visibility",
    domain: "Research Productivity and Quality",
    measure: "Assesses volume, quality, and academic visibility of student research",
    weight: 25,
    indicators: [
      "Publications per student (last 2 years before submission)",
      "Proportion in Q1-Q2 journals",
      "Citations per publication",
      "Conference papers/proceedings",
      "Books/book chapters/reports",
      "Journal impact metrics (IF, quartile)",
    ],
    rubrics: [
      { score: 5, descriptor: "Outstanding", standard: ">=3 Q1/Q2 papers; >=5 citations/publication" },
      { score: 4, descriptor: "Excellent", standard: "2 Q1/Q2 papers; >=4 citations" },
      { score: 3, descriptor: "Very Good", standard: "1 Q1/Q2 paper; >=3 citations" },
      { score: 2, descriptor: "Good", standard: "1 indexed paper; moderate visibility" },
      { score: 1, descriptor: "Satisfactory", standard: "Review paper or Q3/Q4 publication" },
    ],
    evidence: [
      { title: "Published articles and conference proceedings", desc: "Copies of published journal articles and conference papers", attach: true },
      { title: "DOI records", desc: "Digital Object Identifier records for each publication", attach: true },
      { title: "Indexing databases (Web of Science / Scopus)", desc: "Records from Web of Science or Scopus showing indexed publications", attach: false },
      { title: "Citation reports (Google Scholar / Scopus / WoS)", desc: "Citation count reports from recognised databases", attach: true },
      { title: "Journal ranking reports", desc: "Journal impact factor and quartile ranking documentation", attach: false },
    ],
    quant: { assignedScore: 5, weightFactor: 0.25 },
  },
  {
    title: "Program Efficiency",
    domain: "Timeliness and Completion",
    measure: "Assesses completion rates and operational efficiency",
    weight: 25,
    indicators: [
      "PhD completion <=4 years (%)",
      "MPhil completion rate (%)",
      "Thesis evaluation time (months)",
      "Attrition rate (%)",
    ],
    rubrics: [
      { score: 5, descriptor: "Outstanding", standard: ">=40% completion within time; low attrition" },
      { score: 4, descriptor: "Excellent", standard: "41-50% completion within 4 years" },
      { score: 3, descriptor: "Very Good", standard: "51-60% completion within 5 years" },
      { score: 2, descriptor: "Good", standard: "61-70% completion within 6 years" },
      { score: 1, descriptor: "Satisfactory", standard: "71-100% completion; delays within 7 years" },
    ],
    evidence: [
      { title: "Graduation statistics", desc: "Annual graduation and completion rate data", attach: false },
      { title: "Examination records", desc: "Thesis examination records and outcomes", attach: true },
      { title: "Thesis evaluation dates", desc: "Timeline records showing thesis submission to evaluation completion", attach: false },
      { title: "Student enrolment and attrition data", desc: "Enrolment figures and attrition/dropout statistics", attach: false },
    ],
    quant: { assignedScore: 5, weightFactor: 0.25 },
  },
  {
    title: "Supervision Effectiveness",
    domain: "Research Supervision Quality",
    measure: "Assesses the effectiveness and consistency of supervision",
    weight: 20,
    indicators: [
      "Meetings per month",
      "Joint publications with students",
      "Student satisfaction (%)",
      "Completion success rate (%)",
    ],
    rubrics: [
      { score: 4, descriptor: "Outstanding", standard: "Monthly meetings; strong collaboration; high satisfaction" },
      { score: 3, descriptor: "Excellent", standard: "Regular meetings; consistent support" },
      { score: 2, descriptor: "Good", standard: "Regular meetings, infrequent support" },
      { score: 1, descriptor: "Satisfactory", standard: "Infrequent meetings" },
      { score: 0, descriptor: "Unsatisfactory", standard: "No meeting" },
    ],
    evidence: [
      { title: "Meeting logs", desc: "Records of supervisor-student meetings including dates and topics", attach: true },
      { title: "Student surveys", desc: "Student satisfaction survey results", attach: false },
      { title: "Synopsis approval date", desc: "Documentation of synopsis approval timeline", attach: false },
      { title: "Thesis completion data", desc: "Records showing thesis completion under supervision", attach: false },
    ],
    quant: { assignedScore: 4, weightFactor: 0.20 },
  },
  {
    title: "Innovation and Societal Contribution",
    domain: "Innovation and Societal Contribution",
    measure: "Assesses the application of research beyond academia",
    weight: 18,
    indicators: [
      "Patents/IP filings (number)",
      "Industry-funded projects (amount/number)",
      "Policy contributions (citations/use)",
      "Technology transfer outputs",
      "Community-based projects",
    ],
    rubrics: [
      { score: 5, descriptor: "Outstanding", standard: "Patents/commercialization; strong industry linkage" },
      { score: 4, descriptor: "Excellent", standard: "Industry/policy engagement" },
      { score: 3, descriptor: "Very Good", standard: "Applied research outputs" },
      { score: 2, descriptor: "Good", standard: "Partial engagement" },
      { score: 1, descriptor: "Satisfactory", standard: "Limited contribution" },
    ],
    evidence: [
      { title: "Patent submission evidence", desc: "Patent application filings and IP registration documents", attach: true },
      { title: "Industry agreements", desc: "Contracts and agreements with industry partners", attach: true },
      { title: "Policy briefs", desc: "Policy documents and briefs citing or utilising research findings", attach: false },
      { title: "Technology transfer records", desc: "Documentation of technology transfer and commercialisation activities", attach: false },
    ],
    quant: { assignedScore: 5, weightFactor: 0.18 },
  },
  {
    title: "Research Governance",
    domain: "Governance and Compliance",
    measure: "Assesses regulatory compliance and administrative efficiency",
    weight: 12,
    indicators: [
      "Plagiarism compliance (%)",
      "Ethics approvals (timeliness)",
      "Digital tracking system availability",
      "Approval timelines (days)",
    ],
    rubrics: [
      { score: 4, descriptor: "Outstanding", standard: "Fully efficient system; rapid approvals" },
      { score: 3, descriptor: "Excellent", standard: "Efficient system; minor delays" },
      { score: 2, descriptor: "Good", standard: "Moderate efficiency" },
      { score: 1, descriptor: "Satisfactory", standard: "Frequent delays" },
      { score: 0, descriptor: "Unsatisfactory", standard: "Weak governance" },
    ],
    evidence: [
      { title: "Plagiarism reports", desc: "Turnitin or similar plagiarism check reports", attach: true },
      { title: "Ethics approval certificates", desc: "Institutional review board or ethics committee approval certificates", attach: true },
      { title: "Digital thesis tracking systems", desc: "Evidence of digital systems for thesis tracking and monitoring", attach: false },
      { title: "Approval timelines", desc: "Records showing approval processing times for research proposals and ethics applications", attach: false },
    ],
    quant: { assignedScore: 5, weightFactor: 0.12 },
  },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Insert framework
    const fwRes = await client.query(
      `INSERT INTO frameworks (title, description, status, version, created_by)
       VALUES ($1, $2, $3, $4, 1)
       RETURNING id`,
      [FRAMEWORK.title, FRAMEWORK.description, FRAMEWORK.status, FRAMEWORK.version]
    );
    const frameworkId = fwRes.rows[0].id;
    console.log(`Framework created with ID: ${frameworkId}`);

    for (let ci = 0; ci < CRITERIAS.length; ci++) {
      const c = CRITERIAS[ci];
      const eachWeight = c.weight / c.indicators.length;

      // 2. Insert criteria
      const cRes = await client.query(
        `INSERT INTO criteria (framework_id, title, domain, measure, total_weight, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [frameworkId, c.title, c.domain, c.measure, c.weight.toFixed(2), ci]
      );
      const criteriaId = cRes.rows[0].id;
      console.log(`  Criterion ${ci + 1}: ${c.title} (ID: ${criteriaId})`);

      // 3. Insert indicators
      for (let ii = 0; ii < c.indicators.length; ii++) {
        await client.query(
          `INSERT INTO indicators (criteria_id, question, weight, require_attachment, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [criteriaId, c.indicators[ii], eachWeight, false, ii]
        );
      }
      console.log(`    ${c.indicators.length} indicators inserted`);

      // 4. Insert rubrics
      for (let ri = 0; ri < c.rubrics.length; ri++) {
        const r = c.rubrics[ri];
        const descRes = await client.query(
          `SELECT id FROM rubric_descriptors WHERE name = $1 LIMIT 1`,
          [r.descriptor]
        );
        const descriptorId = descRes.rows[0]?.id ?? 3;

        await client.query(
          `INSERT INTO rubrics (criteria_id, score, descriptor_id, performance_standard, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [criteriaId, r.score, descriptorId, r.standard, ri]
        );
      }
      console.log(`    ${c.rubrics.length} rubrics inserted`);

      // 5. Insert quantification
      const weightedScore = (c.quant.assignedScore * c.quant.weightFactor).toFixed(3);
      await client.query(
        `INSERT INTO criteria_quantification (criteria_id, assigned_score, weight_factor, weighted_score)
         VALUES ($1, $2, $3, $4)`,
        [criteriaId, c.quant.assignedScore, c.quant.weightFactor, weightedScore]
      );
      console.log(`    Quantification inserted (score=${c.quant.assignedScore}, factor=${c.quant.weightFactor})`);

      // 6. Insert evidence
      for (let ei = 0; ei < c.evidence.length; ei++) {
        const ev = c.evidence[ei];
        await client.query(
          `INSERT INTO evidence (criteria_id, title, description, require_attachment)
           VALUES ($1, $2, $3, $4)`,
          [criteriaId, ev.title, ev.desc, ev.attach]
        );
      }
      console.log(`    ${c.evidence.length} evidence items inserted`);
    }

    await client.query("COMMIT");
    console.log("\nFramework created successfully!");
    console.log(`View at: http://localhost:3001/frameworks/${frameworkId}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
