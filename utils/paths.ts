// utils/paths.ts
export const productDetailUrl = ({ slug, id }: { slug: string; id?: number }) => {
    return id ? `/product-details/${slug}?id=${id}` : `/product-details/${slug}`;
};