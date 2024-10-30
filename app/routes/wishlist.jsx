import WishlistPage, { loader as wishlistLoader } from '~/components/wishlist/WishlistPage';
import { useLoaderData } from "@remix-run/react";
import SWYM_CONFIG from "~/lib/swym/swymconfig";
import { REG_ID, SESSION_ID } from "~/lib/swym/swymConstants";


export const loader = wishlistLoader;

export default WishlistPage;