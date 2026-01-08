-- Create prebook_status enum
CREATE TYPE public.prebook_status AS ENUM ('driver_needed', 'has_driver', 'lane');

-- Create prebooks table for future load planning
CREATE TABLE public.prebooks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    load_number TEXT,
    status prebook_status NOT NULL DEFAULT 'driver_needed',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prebooks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own prebooks" 
ON public.prebooks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prebooks" 
ON public.prebooks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prebooks" 
ON public.prebooks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prebooks" 
ON public.prebooks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prebooks_updated_at
BEFORE UPDATE ON public.prebooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for date queries
CREATE INDEX idx_prebooks_date ON public.prebooks(date);
CREATE INDEX idx_prebooks_user_id ON public.prebooks(user_id);