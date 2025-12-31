import { useState } from 'react'
import { Edit2, Image as ImageIcon, X, Save } from 'lucide-react'
import { Work } from '../../../common/types'
import { useQueryClient } from '@tanstack/react-query'

interface EditWorkDialogProps {
    work: Work
    isOpen: boolean
    onClose: () => void
}

export function EditWorkDialog({ work, isOpen, onClose }: EditWorkDialogProps) {
    const [title, setTitle] = useState(work.title || '')
    const [circle, setCircle] = useState(work.circle_name || '')
    const [cv, setCv] = useState(work.cv_names || '')
    const [newCoverPath, setNewCoverPath] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const queryClient = useQueryClient()

    if (!isOpen) return null

    const handleSelectImage = async () => {
        const path = await window.api.selectFile()
        if (path) setNewCoverPath(path)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await window.api.updateWork(work.id, {
                title,
                circle_name: circle,
                cv_names: cv,
                new_cover_path: newCoverPath || undefined
            })
            queryClient.invalidateQueries({ queryKey: ['works'] })
            onClose()
        } catch (error) {
            console.error('Failed to update work:', error)
            alert('保存に失敗しました')
        } finally {
            setIsSaving(false)
        }
    }

    const thumbnailSrc = newCoverPath
        ? `resonate-img://${newCoverPath.replace(/\\/g, '/')}`
        : (work.thumbnail_path ? `resonate-img://${work.thumbnail_path.replace(/\\/g, '/')}` : null)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-primary" />
                        作品情報の編集
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex gap-6">
                        <div className="w-40 space-y-2">
                            <div
                                onClick={handleSelectImage}
                                className="aspect-[3/4] bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all relative group overflow-hidden"
                            >
                                {thumbnailSrc ? (
                                    <>
                                        <img src={thumbnailSrc} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <ImageIcon className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-[10px] text-muted-foreground">画像を選択</span>
                                    </>
                                )}
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground">クリックしてジャケットを変更</p>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">タイトル</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="作品タイトル"
                                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">サークル</label>
                                <input
                                    value={circle}
                                    onChange={(e) => setCircle(e.target.value)}
                                    placeholder="サークル名"
                                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">声優 (CV)</label>
                                <input
                                    value={cv}
                                    onChange={(e) => setCv(e.target.value)}
                                    placeholder="声優名（カンマ区切りなど）"
                                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        保存する
                    </button>
                </div>
            </div>
        </div>
    )
}
