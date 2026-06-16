import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { CommandPage } from "./components/pages/CommandPage";
import { UniversitiesPage } from "./components/pages/UniversitiesPage";
import { UniversityDetailPage } from "./components/pages/UniversityDetailPage";
import { MajorsPage } from "./components/pages/MajorsPage";
import { GapsPage } from "./components/pages/GapsPage";
import { OpportunitiesPage } from "./components/pages/OpportunitiesPage";
import { PortfolioPage } from "./components/pages/PortfolioPage";
import { ComparePage } from "./components/pages/ComparePage";
import { CoursesPage } from "./components/pages/CoursesPage";
import { ProjectReviewPage } from "./components/pages/ProjectReviewPage";
import { RoadmapPage } from "./components/pages/RoadmapPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: CommandPage },
      { path: "universities", Component: UniversitiesPage },
      { path: "universities/:id", Component: UniversityDetailPage },
      { path: "majors", Component: MajorsPage },
      { path: "gaps", Component: GapsPage },
      { path: "opportunities", Component: OpportunitiesPage },
      { path: "portfolio", Component: PortfolioPage },
      { path: "compare", Component: ComparePage },
      { path: "courses", Component: CoursesPage },
      { path: "review", Component: ProjectReviewPage },
      { path: "roadmap", Component: RoadmapPage },
      { path: "*", Component: CommandPage },
    ],
  },
]);
