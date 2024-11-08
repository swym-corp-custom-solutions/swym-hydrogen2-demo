import { json, useLoaderData } from "@remix-run/react";
import { REG_ID, SESSION_ID } from "~/lib/swym/swymConstants";
import { CacheNone } from '@shopify/hydrogen';

export const loader = async ({ context, request }) => {
  const url = new URL(request.url);
  const lid = url.searchParams.get("lid");
  if(!lid){
    return { error: "list id not provided " }
  }
  const publicListData = await context.swym.fetchPublicList(lid, { cache: CacheNone()});
  return { publicListData };
};

