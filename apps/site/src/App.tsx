import { Outlet, Route, Routes } from "react-router-dom";
import { Footer, ScrollManager, SiteHeader } from "./components/Chrome";
import { Home } from "./pages/Home";
import { Product } from "./pages/Product";
import { HowItWorks } from "./pages/HowItWorks";
import { ExamplesIndex, ExampleBaseline, ExampleAdversarial, ExampleEvidence } from "./pages/examples/Examples";
import { DOCS_ROUTES } from "./pages/docs";
import { NotFound } from "./pages/NotFound";

function Shell() {
  return (
    <>
      <ScrollManager />
      <SiteHeader />
      <Outlet />
      <Footer />
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="product" element={<Product />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="examples" element={<ExamplesIndex />} />
        <Route path="examples/baseline" element={<ExampleBaseline />} />
        <Route path="examples/adversarial" element={<ExampleAdversarial />} />
        <Route path="examples/evidence" element={<ExampleEvidence />} />
        {DOCS_ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
