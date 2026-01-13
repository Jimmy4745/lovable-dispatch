import { useState, useMemo } from 'react';
import { CalendarNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

interface CalendarNotesPanelProps {
  notes: CalendarNote[];
  onAddNote: (note: Omit<CalendarNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, updates: Partial<CalendarNote>) => void;
  onDeleteNote: (id: string) => void;
}

export function CalendarNotesPanel({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: CalendarNotesPanelProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const notesByDate = useMemo(() => {
    const map: Record<string, CalendarNote[]> = {};
    notes.forEach((note) => {
      const dateKey = note.date;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(note);
    });
    return map;
  }, [notes]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setNewNote('');
    setIsFormOpen(true);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedDate) return;
    
    onAddNote({
      date: format(selectedDate, 'yyyy-MM-dd'),
      note: newNote.trim(),
      isCompleted: false,
    });
    setNewNote('');
  };

  const handleToggleComplete = (note: CalendarNote) => {
    onUpdateNote(note.id, { isCompleted: !note.isCompleted });
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDeleteNote(deleteId);
      setDeleteId(null);
    }
  };

  const selectedDateNotes = selectedDate 
    ? notesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayNotes = notesByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const completedCount = dayNotes.filter(n => n.isCompleted).length;
            const totalCount = dayNotes.length;

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`min-h-[100px] p-2 border-b border-r border-border last:border-r-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                  !isCurrentMonth ? 'bg-muted/30' : ''
                } ${isCurrentDay ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      !isCurrentMonth ? 'text-muted-foreground' : ''
                    } ${isCurrentDay ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''}`}
                  >
                    {format(day, 'd')}
                  </span>
                  {totalCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      completedCount === totalCount 
                        ? 'bg-revenue/20 text-revenue' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {completedCount}/{totalCount}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {dayNotes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className={`text-xs truncate px-1 py-0.5 rounded ${
                        note.isCompleted 
                          ? 'text-muted-foreground line-through bg-muted/50' 
                          : 'text-foreground bg-primary/10'
                      }`}
                    >
                      {note.note}
                    </div>
                  ))}
                  {dayNotes.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayNotes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Notes Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {/* Add new note */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a new note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNote();
                  }
                }}
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Notes list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {selectedDateNotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No notes for this day. Add one above!
                </p>
              ) : (
                selectedDateNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      note.isCompleted 
                        ? 'bg-muted/50 border-muted' 
                        : 'bg-card border-border'
                    }`}
                  >
                    <Checkbox
                      checked={note.isCompleted}
                      onCheckedChange={() => handleToggleComplete(note)}
                      className="mt-0.5"
                    />
                    <span className={`flex-1 text-sm ${note.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {note.note}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(note.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}