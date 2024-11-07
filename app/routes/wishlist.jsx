import WishlistPage from '~/lib/swym/components/wishlist/WishlistPage';
import { fetchWishlist } from '~/lib/swym/loaders/swymloaders';


export const loader = fetchWishlist;

export default WishlistPage;