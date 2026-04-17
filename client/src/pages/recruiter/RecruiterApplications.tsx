import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { APPLICATION_STATUSES } from '../../constants/categories'
import { API_BASE_URL } from '../../constants/config'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Application {
  _id: string
  job: {
    _id: string
    title: string
    location: string
  }
  candidate: {
    _id: string
    name: string
    email: string
  }
  resume?: {
    originalName: string
    fileUrl: string
  }
  status: string
  coverLetter?: string
  atsScore?: number
  matchScore?: number
  createdAt: string
}

type Grouped = Record<string, Application[]>

const statusColors: Record<string, string> = {
  APPLIED: 'bg-gray-100 text-gray-700',
  VIEWED: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  HIRED: 'bg-green-100 text-green-700',
}

const columnColors: Record<string, string> = {
  APPLIED: 'border-gray-300',
  VIEWED: 'border-blue-300',
  INTERVIEW: 'border-yellow-300',
  REJECTED: 'border-red-300',
  HIRED: 'border-green-300',
}

const columnHeaderColors: Record<string, string> = {
  APPLIED: 'bg-gray-50 text-gray-700',
  VIEWED: 'bg-blue-50 text-blue-700',
  INTERVIEW: 'bg-yellow-50 text-yellow-700',
  REJECTED: 'bg-red-50 text-red-700',
  HIRED: 'bg-green-50 text-green-700',
}

function ApplicationCard({
  app,
  isDragging = false,
}: {
  app: Application
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: app._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm ${isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'} transition-shadow`}
    >
      <div className="font-medium text-gray-900 text-sm truncate">{app.candidate?.name}</div>
      <div className="text-xs text-gray-500 truncate mb-1">{app.candidate?.email}</div>
      <div className="text-xs font-medium text-gray-700 truncate">{app.job?.title}</div>
      {app.job?.location && (
        <div className="text-xs text-gray-400 truncate">{app.job.location}</div>
      )}
      {app.resume && (
        <a
          href={`${API_BASE_URL}${app.resume.fileUrl}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline mt-1 block truncate"
          onClick={(e) => e.stopPropagation()}
        >
          📎 {app.resume.originalName}
        </a>
      )}
      <div className="text-xs text-gray-400 mt-1">
        {new Date(app.createdAt).toLocaleDateString()}
      </div>
      {(app.atsScore !== undefined || app.matchScore !== undefined) && (
        <div className="mt-2 text-[11px] text-gray-500">
          ATS: <span className="font-semibold text-gray-300">{app.atsScore ?? '—'}</span> · Match:{' '}
          <span className="font-semibold text-gray-300">{app.matchScore ?? '—'}</span>
        </div>
      )}
    </div>
  )
}

const COLUMN_MIN_WIDTH = 220

function KanbanColumn({
  status,
  label,
  apps,
}: {
  status: string
  label: string
  apps: Application[]
}) {
  const ids = apps.map((a) => a._id)
  return (
    <div className={`flex flex-col min-h-[200px] rounded-xl border-2 ${columnColors[status]} overflow-hidden`} style={{ minWidth: COLUMN_MIN_WIDTH, width: '100%' }}>
      <div className={`px-3 py-2 font-semibold text-sm flex items-center justify-between ${columnHeaderColors[status]}`}>
        <span>{label}</span>
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${statusColors[status]}`}>
          {apps.length}
        </span>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 flex-1 min-h-[80px]">
          {apps.map((app) => (
            <ApplicationCard key={app._id} app={app} />
          ))}
          {apps.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-4">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function RecruiterApplications() {
  const [grouped, setGrouped] = useState<Grouped>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeApp, setActiveApp] = useState<Application | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/applications/for-my-jobs', { params: { group: 'true' } })
        setGrouped(res.data.grouped)
      } catch {
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const findAppById = (id: string): Application | null => {
    for (const apps of Object.values(grouped)) {
      const found = apps.find((a) => a._id === id)
      if (found) return found
    }
    return null
  }

  const findColumnOfApp = (id: string): string | null => {
    for (const [col, apps] of Object.entries(grouped)) {
      if (apps.find((a) => a._id === id)) return col
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const app = findAppById(String(event.active.id))
    setActiveApp(app)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeCol = findColumnOfApp(activeId)
    // Determine target column: over could be a column id or an app id
    const overCol = grouped[overId] ? overId : findColumnOfApp(overId)

    if (!activeCol || !overCol || activeCol === overCol) return

    setGrouped((prev) => {
      const sourceApps = [...(prev[activeCol] || [])]
      const targetApps = [...(prev[overCol] || [])]
      const appIndex = sourceApps.findIndex((a) => a._id === activeId)
      if (appIndex === -1) return prev
      const [movedApp] = sourceApps.splice(appIndex, 1)
      targetApps.push(movedApp)
      return { ...prev, [activeCol]: sourceApps, [overCol]: targetApps }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveApp(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Determine target column
    const targetCol = grouped[overId] ? overId : findColumnOfApp(overId)
    if (!targetCol) return

    const app = findAppById(activeId)
    if (!app || app.status === targetCol) return

    try {
      await api.patch(`/applications/${activeId}/status`, { status: targetCol })
      setGrouped((prev) => {
        const updated = { ...prev }
        for (const col of Object.keys(updated)) {
          updated[col] = updated[col].map((a) =>
            a._id === activeId ? { ...a, status: targetCol } : a
          )
        }
        return updated
      })
    } catch {
      setError('Failed to update status')
      // Revert: refetch
      try {
        const res = await api.get('/applications/for-my-jobs', { params: { group: 'true' } })
        setGrouped(res.data.grouped)
      } catch {
        // ignore
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalApps = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Applications Pipeline</h1>
        <p className="text-gray-500 text-sm">
          {totalApps} application{totalApps !== 1 ? 's' : ''} — drag cards to change status
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {totalApps === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">No applications received yet.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4" style={{ minWidth: `${APPLICATION_STATUSES.length * (COLUMN_MIN_WIDTH + 16)}px` }}>
              {APPLICATION_STATUSES.map((s) => (
                <div key={s.value} style={{ flex: `1 1 ${COLUMN_MIN_WIDTH}px`, minWidth: COLUMN_MIN_WIDTH, maxWidth: 300 }}>
                  <KanbanColumn
                    status={s.value}
                    label={s.label}
                    apps={grouped[s.value] || []}
                  />
                </div>
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeApp ? (
              <ApplicationCard app={activeApp} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
