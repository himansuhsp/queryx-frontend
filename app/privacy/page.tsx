export default function PrivacyPolicy() {
  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "auto" }}>
      <h1>Privacy Policy – QueryX</h1>

      <p>
        QueryX ("we", "our", "us") is an educational AI-based PCMB problem solver.
        This Privacy Policy explains how we handle user information.
      </p>

      <h2>Information We Collect</h2>
      <p>
        QueryX does not require users to create an account.
        We may process questions (text or images) submitted by users
        only to generate answers.
      </p>

      <h2>How We Use Information</h2>
      <ul>
        <li>To generate academic solutions</li>
        <li>To improve app performance and reliability</li>
        <li>To enforce daily usage limits</li>
      </ul>

      <h2>Data Storage</h2>
      <p>
        We do not sell, rent, or share personal data with third parties.
        Temporary processing may occur on secure servers for answer generation.
      </p>

      <h2>Children’s Privacy</h2>
      <p>
        QueryX is intended for students and learners.
        We do not knowingly collect personal data from children.
      </p>

      <h2>Disclaimer</h2>
      <p>
        QueryX provides AI-generated academic assistance.
        Results should be verified with textbooks or teachers.
      </p>

      <h2>Contact</h2>
      <p>
        If you have questions, contact us at:
        <br />
        <b>support@queryxai.com</b>
      </p>

      <p style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        Last updated: {new Date().toDateString()}
      </p>
    </main>
  );
}
