import { EditorLayout } from '@/components/editor/EditorLayout';
import { MangaGrid } from '@/components/editor/MangaGrid';
import { ChatPanel } from '@/components/editor/ChatPanel';
import { EditorToolbar } from '@/components/editor/Toolbar';

type Params = { pageId: string };

export default async function EditorPage({ params }: { params: Promise<Params> }) {
  const { pageId } = await params;
  return (
    <EditorLayout
      toolbar={<EditorToolbar pageLabel={`page: ${pageId}`} />}
      canvas={<MangaGrid />}
      chat={<ChatPanel />}
    />
  );
}
