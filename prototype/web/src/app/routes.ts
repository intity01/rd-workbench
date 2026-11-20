import { createBrowserRouter } from 'react-router'
import { HelpPage } from './features/help/HelpPage'
import { NotFound } from './features/help/NotFound'
import { HomePage } from './features/home/HomePage'
import { ImportsPage } from './features/imports/ImportsPage'
import { LibraryPage } from './features/library/LibraryPage'
import { KnowledgeMapPage } from './features/map/KnowledgeMapPage'
import { NewProjectPage } from './features/projects/NewProjectPage'
import { ProjectOverviewPage } from './features/projects/ProjectOverviewPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { WorkspacePage } from './features/research/WorkspacePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TasksPage } from './features/tasks/TasksPage'
import { VerificationPage } from './features/verify/VerificationPage'
import { Shell } from './shell/Shell'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: Shell,
      children: [
        { index: true, Component: HomePage },
        { path: 'projects', Component: ProjectsPage },
        { path: 'projects/new', Component: NewProjectPage },
        { path: 'projects/:id', Component: ProjectOverviewPage },
        { path: 'research', Component: WorkspacePage },
        { path: 'imports', Component: ImportsPage },
        { path: 'verify', Component: VerificationPage },
        { path: 'library', Component: LibraryPage },
        { path: 'map', Component: KnowledgeMapPage },
        { path: 'tasks', Component: TasksPage },
        { path: 'settings', Component: SettingsPage },
        { path: 'help', Component: HelpPage },
        { path: '*', Component: NotFound },
      ],
    },
  ],
  base ? { basename: base } : undefined,
)
