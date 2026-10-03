/**
 * Vietnamese language pack: one dictionary module per Client UI namespace,
 * registered by this package's Client half alongside the built-in zh/en
 * dictionaries. Keys mirror the zh key set exactly; a missing key falls back
 * to English through the runtime's declared fallback chain.
 */
import type { LocaleDict } from '../../client/index.ts'
import { vi as workspace } from './workspace.ts'
import { vi as workflowRun } from './workflowRun.ts'
import { vi as question } from './question.ts'
import { vi as trajectory } from './trajectory.ts'
import { vi as settingsTheme } from './settings-theme.ts'
import { vi as subagent } from './subagent.ts'
import { vi as skill } from './skill.ts'
import { vi as sidebarTerminal } from './sidebarTerminal.ts'
import { vi as sidebarRight } from './sidebarRight.ts'
import { vi as sidebarFiles } from './sidebarFiles.ts'
import { vi as sidebarDocumentPreview } from './sidebarDocumentPreview.ts'
import { vi as sidebarPdf } from './sidebarPdf.ts'
import { vi as sidebarOffice } from './sidebarOffice.ts'
import { vi as documentMarkdown } from './documentMarkdown.ts'
import { vi as sidebarImage } from './sidebarImage.ts'
import { vi as documentHtml } from './documentHtml.ts'
import { vi as sidebarExcel } from './sidebarExcel.ts'
import { vi as sidebarCodePreview } from './sidebarCodePreview.ts'
import { vi as sidebarBrowser } from './sidebarBrowser.ts'
import { vi as sidebar } from './sidebar.ts'
import { vi as shortcuts } from './shortcuts.ts'
import { vi as settingsWebSearch } from './settings-webSearch.ts'
import { vi as settingsSubagent } from './settings-subagent.ts'
import { vi as settingsShell } from './settings-shell.ts'
import { vi as settingsSessionLog } from './settings-sessionLog.ts'
import { vi as settingsPlugins } from './settings-plugins.ts'
import { vi as settingsPluginInventory } from './settings-pluginInventory.ts'
import { vi as settingsModels } from './settings-models.ts'
import { vi as settings } from './settings.ts'
import { vi as settingsAgentLoop } from './settings-agentLoop.ts'
import { vi as settingsAccount } from './settings-account.ts'
import { vi as scheduleCatalog } from './schedule-catalog.ts'
import { vi as scheduleManager } from './schedule-manager.ts'
import { vi as reference } from './reference.ts'
import { vi as pluginManager } from './pluginManager.ts'
import { vi as plan } from './plan.ts'
import { vi as permissionAccess } from './permission-access.ts'
import { vi as settingsPermission } from './settings-permission.ts'
import { vi as openInApp } from './open-in-app.ts'
import { vi as model } from './model.ts'
import { vi as feedback } from './feedback.ts'
import { vi as shortcutsLayout } from './shortcuts-layout.ts'
import { vi as job } from './job.ts'
import { vi as slashMenu } from './slash-menu.ts'
import { vi as goal } from './goal.ts'
import { vi as directoryBrowser } from './directory-browser.ts'
import { vi as deliverables } from './deliverables.ts'
import { vi as conversation } from './conversation.ts'
import { vi as command } from './command.ts'
import { vi as chat } from './chat.ts'
import { vi as approval } from './approval.ts'
import { vi as settingsAgentPreset } from './settings-agentPreset.ts'
import { vi as common } from './common.ts'
import { vi as settingsLocale } from './settings-locale.ts'

/** Language definition published to the language selector. */
export const VI_LANGUAGE = Object.freeze({ id: 'vi', label: 'Tiếng Việt', fallback: 'en' })

/** One dictionary per namespace, in registration order. */
export const VI_NAMESPACES: readonly (readonly [string, LocaleDict])[] = Object.freeze([
  ['workspace', workspace],
  ['workflowRun', workflowRun],
  ['question', question],
  ['trajectory', trajectory],
  ['settings.theme', settingsTheme],
  ['subagent', subagent],
  ['skill', skill],
  ['sidebarTerminal', sidebarTerminal],
  ['sidebarRight', sidebarRight],
  ['sidebarFiles', sidebarFiles],
  ['sidebarDocumentPreview', sidebarDocumentPreview],
  ['sidebarPdf', sidebarPdf],
  ['sidebarOffice', sidebarOffice],
  ['documentMarkdown', documentMarkdown],
  ['sidebarImage', sidebarImage],
  ['documentHtml', documentHtml],
  ['sidebarExcel', sidebarExcel],
  ['sidebarCodePreview', sidebarCodePreview],
  ['sidebarBrowser', sidebarBrowser],
  ['sidebar', sidebar],
  ['shortcuts', shortcuts],
  ['settings.webSearch', settingsWebSearch],
  ['settings.subagent', settingsSubagent],
  ['settings.shell', settingsShell],
  ['settings.sessionLog', settingsSessionLog],
  ['settings.plugins', settingsPlugins],
  ['settings.pluginInventory', settingsPluginInventory],
  ['settings.models', settingsModels],
  ['settings', settings],
  ['settings.agentLoop', settingsAgentLoop],
  ['settings.account', settingsAccount],
  ['schedule.catalog', scheduleCatalog],
  ['schedule.manager', scheduleManager],
  ['reference', reference],
  ['pluginManager', pluginManager],
  ['plan', plan],
  ['permission.access', permissionAccess],
  ['settings.permission', settingsPermission],
  ['open-in-app', openInApp],
  ['model', model],
  ['feedback', feedback],
  ['shortcuts.layout', shortcutsLayout],
  ['job', job],
  ['slash.menu', slashMenu],
  ['goal', goal],
  ['directory-browser', directoryBrowser],
  ['deliverables', deliverables],
  ['conversation', conversation],
  ['command', command],
  ['chat', chat],
  ['approval', approval],
  ['settings.agentPreset', settingsAgentPreset],
  ['common', common],
  ['settings.locale', settingsLocale],
])
