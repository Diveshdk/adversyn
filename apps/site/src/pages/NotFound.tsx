import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <main id="main" className="container notfound">
      <p className="eyebrow">404</p>
      <h1>This page does not exist.</h1>
      <p>The link may be outdated. The documentation and examples are listed below.</p>
      <div className="hero-ctas">
        <Link to="/docs" className="btn btn-primary">
          Documentation
        </Link>
        <Link to="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </main>
  );
}
