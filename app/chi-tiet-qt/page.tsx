'use client';
'use client';

import { useSearchParams } from 'next/navigation';
import GiftDetailContent from '@/components/GiftDetailContent';

export default function GiftDetailPage() {
    const slug = useSearchParams().get('slug');
    if (!slug) return null;           // hoặc hiển thị thông báo lỗi
    return <GiftDetailContent slug={slug} />;
}
