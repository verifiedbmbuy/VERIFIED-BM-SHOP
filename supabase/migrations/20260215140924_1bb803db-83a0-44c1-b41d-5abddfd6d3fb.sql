
-- Chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT,
  visitor_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  admin_typing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user', -- 'user', 'assistant', 'admin'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_sessions
CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view own session" ON public.chat_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can update session" ON public.chat_sessions FOR UPDATE USING (true);
CREATE POLICY "Admins can delete sessions" ON public.chat_sessions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for chat_messages
CREATE POLICY "Anyone can insert messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Admins can delete messages" ON public.chat_messages FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Update timestamp trigger for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_orders_updated_at();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Trigger to create notification for admins on new chat session
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  session_record RECORD;
BEGIN
  -- Only notify on user messages
  IF NEW.role != 'user' THEN RETURN NEW; END IF;
  
  SELECT * INTO session_record FROM public.chat_sessions WHERE id = NEW.session_id;
  
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.user_id,
      'New Chat Message',
      'Message from ' || COALESCE(session_record.visitor_name, 'Visitor') || ': ' || LEFT(NEW.content, 80),
      'support',
      '/admin/messages?session=' || NEW.session_id::text
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_chat_message();
