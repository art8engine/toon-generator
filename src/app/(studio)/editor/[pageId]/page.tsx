import { EditorLayout } from '@/components/editor/EditorLayout';
import { A4Canvas } from '@/components/editor/A4Canvas';
import { ChatPanel } from '@/components/editor/ChatPanel';
import { EditorToolbar } from '@/components/editor/Toolbar';

type Params = { pageId: string };

export default async function EditorPage({ params }: { params: Promise<Params> }) {
  const { pageId } = await params;
  return (
    <EditorLayout
      toolbar={<EditorToolbar pageLabel={`page: ${pageId}`} />}
      canvas={<A4Canvas />}
      chat={<ChatPanel />}
    />
  );
}
