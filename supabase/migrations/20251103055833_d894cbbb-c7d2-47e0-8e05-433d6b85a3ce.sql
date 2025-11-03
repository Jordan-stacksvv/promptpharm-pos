-- Add foreign key relationship between sale_items and medicines
ALTER TABLE public.sale_items
ADD CONSTRAINT sale_items_medicine_id_fkey 
FOREIGN KEY (medicine_id) 
REFERENCES public.medicines(id) 
ON DELETE RESTRICT;