-- Create scan_logs table to track all barcode scans
CREATE TABLE IF NOT EXISTS public.scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  context TEXT NOT NULL CHECK (context IN ('sales', 'inventory')),
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view scan logs
CREATE POLICY "Authenticated users can view scan logs"
  ON public.scan_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to create scan logs
CREATE POLICY "Authenticated users can create scan logs"
  ON public.scan_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = scanned_by);

-- Enable realtime for scan_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs;

-- Add index for better query performance
CREATE INDEX idx_scan_logs_created_at ON public.scan_logs(created_at DESC);
CREATE INDEX idx_scan_logs_context ON public.scan_logs(context);