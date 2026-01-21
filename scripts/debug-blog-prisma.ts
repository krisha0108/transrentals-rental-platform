
import { fetchBlogPostsPrisma } from '../src/lib/api/blog-prisma';
import { prisma } from '../src/lib/db/prisma';

async function main() {
    console.log('Starting debug...');

    try {
        console.log('1. Fetch default posts');
        await fetchBlogPostsPrisma({});
        console.log('✓ Default fetch success');
    } catch (e) {
        console.error('✗ Default fetch failed:', e);
    }

    try {
        console.log('2. Fetch with tag');
        await fetchBlogPostsPrisma({ tag: 'travel-tips' });
        console.log('✓ Tag fetch success');
    } catch (e) {
        console.error('✗ Tag fetch failed:', e);
    }

    try {
        console.log('3. Fetch with category');
        await fetchBlogPostsPrisma({ category: 'road-trip-guides' });
        console.log('✓ Category fetch success');
    } catch (e) {
        console.error('✗ Category fetch failed:', e);
    }

    try {
        console.log('4. Fetch with search');
        await fetchBlogPostsPrisma({ search: 'car' });
        console.log('✓ Search fetch success');
    } catch (e) {
        console.error('✗ Search fetch failed:', e);
    }

    // Edge cases
    try {
        console.log('5. Fetch with invalid page (0)');
        // @ts-ignore
        await fetchBlogPostsPrisma({ page: 0 });
        console.log('✓ Page 0 fetch success');
    } catch (e) {
        console.error('✗ Page 0 fetch failed:', e);
    }

    try {
        console.log('6. Fetch with invalid limit (-1)');
        // @ts-ignore
        await fetchBlogPostsPrisma({ limit: -1 });
        console.log('✓ Limit -1 fetch success');
    } catch (e) {
        console.error('✗ Limit -1 fetch failed:', e);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
