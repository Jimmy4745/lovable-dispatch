-- Add truck_number column to drivers table
ALTER TABLE public.drivers
ADD COLUMN truck_number TEXT;

-- Create notes table for calendar notes (replacing prebook functionality)
CREATE TABLE public.calendar_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  note TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on calendar_notes
ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calendar_notes
CREATE POLICY "Users can view their own calendar notes" 
ON public.calendar_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar notes" 
ON public.calendar_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar notes" 
ON public.calendar_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar notes" 
ON public.calendar_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at on calendar_notes
CREATE TRIGGER update_calendar_notes_updated_at
BEFORE UPDATE ON public.calendar_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();