'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Workflow,
  Play,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Zap,
  Hand,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  History,
  ArrowLeft,
  GripVertical,
  Save,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  Workflow as WorkflowType,
  WorkflowRun,
  Trigger,
  Action,
  ActionType,
  EventTriggerType,
} from './types'
import { DEFAULT_TRIGGER, DEFAULT_ACTIONS } from './types'
import {
  CRON_PRESETS,
  describeCron,
  EVENT_DESCRIPTIONS,
  ACTION_DESCRIPTIONS,
} from '@/lib/workflows'

interface WorkflowsProps {
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
}

type ViewMode = 'list' | 'edit' | 'history'

export function Workflows({ onClose, onMinimize, onMaximize }: WorkflowsProps) {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runs, setRuns] = useState<WorkflowRun[]>([])

  // Form state for editing
  const [formData, setFormData] = useState<{
    name: string
    description: string
    trigger: Trigger
    actions: Action[]
    enabled: boolean
  }>({
    name: '',
    description: '',
    trigger: DEFAULT_TRIGGER,
    actions: [],
    enabled: false,
  })

  const fetchWorkflows = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/workflows')
      if (!res.ok) throw new Error('Failed to fetch workflows')
      const data = await res.json()
      setWorkflows(data.workflows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  const fetchRuns = async (workflowId: string) => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}?runs=true`)
      if (!res.ok) throw new Error('Failed to fetch runs')
      const data = await res.json()
      setRuns(data.runs || [])
    } catch (err) {
      console.error('Error fetching runs:', err)
    }
  }

  const handleToggleEnabled = async (workflow: WorkflowType) => {
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !workflow.enabled }),
      })
      if (!res.ok) throw new Error('Failed to toggle workflow')
      fetchWorkflows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleRunWorkflow = async (workflow: WorkflowType) => {
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: 'POST',
      })
      if (res.status === 429) {
        const data = await res.json()
        setError(`Rate limited. Retry in ${data.retryAfter}s`)
        return
      }
      if (!res.ok) throw new Error('Failed to run workflow')
      fetchWorkflows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleDeleteWorkflow = async (workflow: WorkflowType) => {
    if (!confirm(`Delete workflow "${workflow.name}"?`)) return
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete workflow')
      fetchWorkflows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleSaveWorkflow = async () => {
    try {
      const method = selectedWorkflow ? 'PUT' : 'POST'
      const url = selectedWorkflow
        ? `/api/workflows/${selectedWorkflow.id}`
        : '/api/workflows'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.details?.join(', ') || data.error || 'Failed to save')
      }

      await fetchWorkflows()
      setViewMode('list')
      setSelectedWorkflow(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const startNewWorkflow = () => {
    setSelectedWorkflow(null)
    setFormData({
      name: '',
      description: '',
      trigger: DEFAULT_TRIGGER,
      actions: [],
      enabled: false,
    })
    setViewMode('edit')
  }

  const startEditWorkflow = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow)
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      trigger: workflow.trigger,
      actions: workflow.actions,
      enabled: workflow.enabled,
    })
    setViewMode('edit')
  }

  const viewHistory = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow)
    fetchRuns(workflow.id)
    setViewMode('history')
  }

  const getTriggerIcon = (trigger: Trigger) => {
    switch (trigger.type) {
      case 'schedule':
        return <Clock className="w-4 h-4" />
      case 'event':
        return <Zap className="w-4 h-4" />
      case 'manual':
        return <Hand className="w-4 h-4" />
    }
  }

  const getTriggerLabel = (trigger: Trigger) => {
    switch (trigger.type) {
      case 'schedule':
        return describeCron(trigger.cron)
      case 'event':
        return EVENT_DESCRIPTIONS[trigger.eventType]
      case 'manual':
        return 'Manual trigger'
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          />
          <button
            onClick={onMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
          />
          <button
            onClick={onMaximize}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-zinc-300">Workflow Automation</span>
        </div>
        <div className="w-14" />
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-medium text-zinc-300">
                {workflows.length} Workflow{workflows.length !== 1 ? 's' : ''}
              </h2>
              <Button size="sm" onClick={startNewWorkflow}>
                <Plus className="w-4 h-4 mr-1" />
                New Workflow
              </Button>
            </div>

            {/* Workflow list */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-zinc-500">
                  Loading...
                </div>
              ) : workflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-500">
                  <Workflow className="w-8 h-8" />
                  <p className="text-sm">No workflows yet</p>
                  <Button size="sm" variant="outline" onClick={startNewWorkflow}>
                    Create your first workflow
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {workflows.map(workflow => (
                    <motion.div
                      key={workflow.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-zinc-200 truncate">
                              {workflow.name}
                            </h3>
                            <button
                              onClick={() => handleToggleEnabled(workflow)}
                              className="text-zinc-400 hover:text-zinc-200"
                              title={workflow.enabled ? 'Disable' : 'Enable'}
                            >
                              {workflow.enabled ? (
                                <ToggleRight className="w-5 h-5 text-green-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          {workflow.description && (
                            <p className="text-sm text-zinc-500 mt-1 truncate">
                              {workflow.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                            <div className="flex items-center gap-1">
                              {getTriggerIcon(workflow.trigger)}
                              {getTriggerLabel(workflow.trigger)}
                            </div>
                            <div className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" />
                              {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                            </div>
                            {workflow.lastRun && (
                              <div className="flex items-center gap-1">
                                {workflow.lastRunStatus === 'success' ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-400" />
                                )}
                                {workflow.runCount} runs
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleRunWorkflow(workflow)}
                            title="Run now"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => viewHistory(workflow)}
                            title="View history"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => startEditWorkflow(workflow)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDeleteWorkflow(workflow)}
                            title="Delete"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}

        {viewMode === 'edit' && (
          <WorkflowEditor
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveWorkflow}
            onCancel={() => {
              setViewMode('list')
              setSelectedWorkflow(null)
            }}
            isNew={!selectedWorkflow}
          />
        )}

        {viewMode === 'history' && selectedWorkflow && (
          <WorkflowHistory
            workflow={selectedWorkflow}
            runs={runs}
            onBack={() => {
              setViewMode('list')
              setSelectedWorkflow(null)
            }}
            onRunNow={() => handleRunWorkflow(selectedWorkflow)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Form data type
interface WorkflowFormData {
  name: string
  description: string
  trigger: Trigger
  actions: Action[]
  enabled: boolean
}

// Workflow Editor Component
interface WorkflowEditorProps {
  formData: WorkflowFormData
  setFormData: React.Dispatch<React.SetStateAction<WorkflowFormData>>
  onSave: () => void
  onCancel: () => void
  isNew: boolean
}

function WorkflowEditor({ formData, setFormData, onSave, onCancel, isNew }: WorkflowEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const addAction = (type: ActionType) => {
    setFormData((prev: WorkflowFormData) => ({
      ...prev,
      actions: [...prev.actions, { ...DEFAULT_ACTIONS[type] }],
    }))
  }

  const removeAction = (index: number) => {
    setFormData((prev: WorkflowFormData) => ({
      ...prev,
      actions: prev.actions.filter((_: Action, i: number) => i !== index),
    }))
  }

  const updateAction = (index: number, updates: Partial<Action>) => {
    setFormData((prev: WorkflowFormData) => ({
      ...prev,
      actions: prev.actions.map((a: Action, i: number) => (i === index ? { ...a, ...updates } as Action : a)),
    }))
  }

  const moveAction = (from: number, to: number) => {
    setFormData((prev: WorkflowFormData) => {
      const actions = [...prev.actions]
      const [moved] = actions.splice(from, 1)
      actions.splice(to, 0, moved)
      return { ...prev, actions }
    })
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      moveAction(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <motion.div
      key="editor"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Button size="icon-sm" variant="ghost" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-medium text-zinc-300">
            {isNew ? 'New Workflow' : 'Edit Workflow'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 max-w-2xl">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400">Basic Information</h3>
            <div className="space-y-3">
              <Input
                placeholder="Workflow name"
                value={formData.name}
                onChange={e => setFormData((prev: WorkflowFormData) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Description (optional)"
                value={formData.description}
                onChange={e => setFormData((prev: WorkflowFormData) => ({ ...prev, description: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={e => setFormData((prev: WorkflowFormData) => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded border-zinc-600"
                />
                Enable workflow
              </label>
            </div>
          </div>

          {/* Trigger */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400">Trigger</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['manual', 'schedule', 'event'] as const).map(type => (
                <button
                  key={type}
                  onClick={() =>
                    setFormData((prev: WorkflowFormData) => ({
                      ...prev,
                      trigger:
                        type === 'manual'
                          ? { type: 'manual' }
                          : type === 'schedule'
                          ? { type: 'schedule', cron: '0 * * * *' }
                          : { type: 'event', eventType: 'error' },
                    }))
                  }
                  className={`p-3 rounded-lg border transition-colors ${
                    formData.trigger.type === type
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {type === 'manual' && <Hand className="w-5 h-5" />}
                    {type === 'schedule' && <Clock className="w-5 h-5" />}
                    {type === 'event' && <Zap className="w-5 h-5" />}
                    <span className="text-xs capitalize">{type}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Trigger Configuration */}
            {formData.trigger.type === 'schedule' && (
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Cron Expression</label>
                <Input
                  value={formData.trigger.cron}
                  onChange={e =>
                    setFormData((prev: WorkflowFormData) => ({
                      ...prev,
                      trigger: { ...prev.trigger, cron: e.target.value } as Trigger,
                    }))
                  }
                  placeholder="* * * * *"
                />
                <div className="flex flex-wrap gap-1">
                  {CRON_PRESETS.map(preset => (
                    <button
                      key={preset.cron}
                      onClick={() =>
                        setFormData((prev: WorkflowFormData) => ({
                          ...prev,
                          trigger: { type: 'schedule', cron: preset.cron },
                        }))
                      }
                      className="px-2 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.trigger.type === 'event' && (
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Event Type</label>
                <select
                  value={formData.trigger.eventType}
                  onChange={e =>
                    setFormData((prev: WorkflowFormData) => ({
                      ...prev,
                      trigger: {
                        type: 'event',
                        eventType: e.target.value as EventTriggerType,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm"
                >
                  {(Object.entries(EVENT_DESCRIPTIONS) as [EventTriggerType, string][]).map(
                    ([type, desc]) => (
                      <option key={type} value={type}>
                        {desc}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-400">Actions</h3>
              <div className="flex gap-1">
                {(Object.keys(ACTION_DESCRIPTIONS) as ActionType[]).map(type => (
                  <Button
                    key={type}
                    size="xs"
                    variant="outline"
                    onClick={() => addAction(type)}
                    title={ACTION_DESCRIPTIONS[type]}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {type.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {formData.actions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-700 rounded-lg">
                Add actions to build your workflow
              </div>
            ) : (
              <div className="space-y-2">
                {formData.actions.map((action, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 bg-zinc-800/50 rounded-lg border transition-colors ${
                      draggedIndex === index
                        ? 'border-purple-500 opacity-50'
                        : 'border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="cursor-grab text-zinc-500 hover:text-zinc-300 mt-1">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-400 capitalize">
                            {index + 1}. {action.type.replace('_', ' ')}
                          </span>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => removeAction(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <ActionEditor
                          action={action}
                          onChange={updates => updateAction(index, updates)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  )
}

// Action Editor Component
interface ActionEditorProps {
  action: Action
  onChange: (updates: Partial<Action>) => void
}

function ActionEditor({ action, onChange }: ActionEditorProps) {
  switch (action.type) {
    case 'notify':
      return (
        <div className="space-y-2">
          <Input
            placeholder="Title"
            value={action.title}
            onChange={e => onChange({ title: e.target.value })}
          />
          <textarea
            placeholder="Message"
            value={action.message}
            onChange={e => onChange({ message: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700 resize-none"
            rows={2}
          />
          <select
            value={action.priority || 'normal'}
            onChange={e => onChange({ priority: e.target.value as 'low' | 'normal' | 'high' | 'critical' })}
            className="px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700"
          >
            <option value="low">Low Priority</option>
            <option value="normal">Normal Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>
        </div>
      )

    case 'send_message':
      return (
        <div className="space-y-2">
          <select
            value={action.channel}
            onChange={e => onChange({ channel: e.target.value as typeof action.channel })}
            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700"
          >
            <option value="telegram">Telegram</option>
            <option value="discord">Discord</option>
            <option value="signal">Signal</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
          <textarea
            placeholder="Message"
            value={action.message}
            onChange={e => onChange({ message: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700 resize-none"
            rows={2}
          />
        </div>
      )

    case 'spawn_agent':
      return (
        <div className="space-y-2">
          <Input
            placeholder="Agent type"
            value={action.agentType}
            onChange={e => onChange({ agentType: e.target.value })}
          />
          <textarea
            placeholder="Agent prompt"
            value={action.prompt}
            onChange={e => onChange({ prompt: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700 resize-none"
            rows={3}
          />
          <Input
            type="number"
            placeholder="Max turns (optional)"
            value={action.maxTurns || ''}
            onChange={e => onChange({ maxTurns: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
      )

    case 'pause_agent':
      return (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={action.all}
              onChange={e => onChange({ all: e.target.checked, agentId: e.target.checked ? undefined : action.agentId })}
              className="rounded border-zinc-600"
            />
            Pause all agents
          </label>
          {!action.all && (
            <Input
              placeholder="Agent ID"
              value={action.agentId || ''}
              onChange={e => onChange({ agentId: e.target.value })}
            />
          )}
        </div>
      )

    case 'run_command':
      return (
        <div className="space-y-2">
          <Input
            placeholder="Command (e.g., openclaw status)"
            value={action.command}
            onChange={e => onChange({ command: e.target.value })}
          />
          <p className="text-xs text-zinc-500">
            Only safe commands allowed: openclaw, git status, ls, etc.
          </p>
        </div>
      )

    default:
      return null
  }
}

// Workflow History Component
interface WorkflowHistoryProps {
  workflow: WorkflowType
  runs: WorkflowRun[]
  onBack: () => void
  onRunNow: () => void
}

function WorkflowHistory({ workflow, runs, onBack, onRunNow }: WorkflowHistoryProps) {
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Button size="icon-sm" variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-sm font-medium text-zinc-300">{workflow.name}</h2>
            <p className="text-xs text-zinc-500">Run History</p>
          </div>
        </div>
        <Button size="sm" onClick={onRunNow}>
          <Play className="w-4 h-4 mr-1" />
          Run Now
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-500">
            <RotateCcw className="w-8 h-8" />
            <p className="text-sm">No runs yet</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {runs.map(run => (
              <div
                key={run.id}
                className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {run.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : run.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                    )}
                    <span className="text-sm font-medium text-zinc-200 capitalize">
                      {run.status}
                    </span>
                    <span className="text-xs text-zinc-500 capitalize">
                      ({run.trigger} trigger)
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(run.startedAt).toLocaleString()}
                  </span>
                </div>
                {run.error && (
                  <div className="mb-2 px-2 py-1 text-xs text-red-400 bg-red-500/10 rounded">
                    {run.error}
                  </div>
                )}
                <div className="space-y-1">
                  {run.results.map((result, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded bg-zinc-900/50"
                    >
                      <span className="text-zinc-400 capitalize">
                        {result.actionType.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">{result.duration}ms</span>
                        {result.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  )
}

export default Workflows
