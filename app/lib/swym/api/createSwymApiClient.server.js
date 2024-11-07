import {createWithCache, CacheLong, CacheNone} from '@shopify/hydrogen';
import { json } from "@remix-run/server-runtime";
import { v4 as uuidv4 } from "uuid";
import SWYM_CONFIG from '~/lib/swym/swymconfig';
import { REG_ID, SESSION_ID } from '~/lib/swym/swymConstants';


export function createSwymApiClient({
  env,
  request,
  session,
  cache,
  waitUntil,
}) {

  const withCache = createWithCache({cache, waitUntil});

  async function generateRegId(options = { cache: CacheNone() }) {
    return withCache(
      ['swym', request.url],
      options.cache,
      async function () {
        // call to the API
        const url = new URL(request.url);
        const useremail = url.searchParams.get("useremail");

        const swymApiEndpoint = `${SWYM_CONFIG.SWYM_ENDPOINT}/storeadmin/v3/user/generate-regid`;
        const apiKey = SWYM_CONFIG.REST_API_KEY;
        const pid = SWYM_CONFIG.PID;

        // Base64 encoding of pid:apiKey
        const encodedCredentials = btoa(`${pid}:${apiKey}`);

        const searchParams = {
            useragenttype: "mobileApp",
        };

        if (useremail) {
            searchParams.useremail = useremail;
        } else {
            searchParams.uuid = uuidv4();
        }

        try{
            // Make the API request to generate regid
            const response = await fetch(swymApiEndpoint, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${encodedCredentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(searchParams),
            });

            // Check if the request was successful
            if (!response.ok) {
            throw new Error("Failed to generate regid");
            }

            // Parse the response
            const data = await response.json();

            session.set(SESSION_ID, data.sessionid);
            session.set(REG_ID, data.regid);
            return data;
        }catch (error) {
            return json({ error: error.message }, { status: 500 });
        }
      },
    );
  }

  async function createList(lname = 'My Wishlist', options = { cache: CacheLong() }) {
    return withCache(
      ['swym', 'createList', lname],
      options.cache,
      async function () {
        if (!session.get(REG_ID)) {
          await generateRegId();  // Call generateRegId instead of callGenrateRegidAPI
          return createList(lname);
        }

        let sessionid = session.get(SESSION_ID);
        let regid = session.get(REG_ID);
  
        const urlencoded = new URLSearchParams();
        urlencoded.append('lname', lname);
        urlencoded.append('regid', regid);
        urlencoded.append('sessionid', sessionid);
        const swymApiEndpoint = `${SWYM_CONFIG.SWYM_ENDPOINT}/api/v3/lists/create?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;
        const response = await fetch(
          swymApiEndpoint,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
              'user-agent': 'headlesswebApp',
            },
            body: new URLSearchParams({
              lname: lname.toString(),
              regid: regid.toString(),
              sessionid: sessionid.toString(),
            }),
          }
        ).catch((error)=>{
          console.log('error ', error);
        });
  
        console.log(response);

        // if (!response.ok) {
        //   throw new Error('Failed to create wishlist');
        // }
  
        return await response.json();
      }
    );
  }
  

  async function updateList(productId, variantId, productUrl, lid, options = { cache: CacheLong() }) {
    return withCache(
      ['swym', 'updateList', productId, variantId, lid],
      options.cache,
      async function () {
        if (!session.get(REG_ID)) {
          await generateRegId();  // Call generateRegId instead of callGenrateRegidAPI
          return updateList(productId, variantId, productUrl, lid);
        }
  
        const urlencoded = new URLSearchParams();
        urlencoded.append('regid', session.get(REG_ID));
        urlencoded.append('sessionid', session.get(SESSION_ID));
        urlencoded.append('lid', lid);
        urlencoded.append('a', `[{ "epi":${variantId}, "empi": ${productId}, "du":"${productUrl}" , "_cv":true , "cprops": {"ou":"${productUrl}"}, "note": null, "qty": 1 }]`);
  
        const swymApiEndpoint = `${SWYM_CONFIG.SWYM_ENDPOINT}/api/v3/lists/update-ctx?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;

        const response = await fetch(
          swymApiEndpoint,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
              'user-agent': 'headlesswebApp'
            },
            body: urlencoded,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update wishlist');
        }
  
        return await response.json();
      }
    );
  }  
  
  
  async function addToWishlist(productId, variantId, productUrl, customLid, options = { cache: CacheLong() }) {
    return withCache(
      ['swym', 'addToWishlist', productId, variantId],
      options.cache,
      async function () {
        let lid = '';
        if (!session.get(REG_ID)) {
          await generateRegId();  // Ensure the session and regid exist
          return addToWishlist(productId, variantId, productUrl, customLid);
        } else if (customLid) {
          return updateList(productId, variantId, productUrl, customLid);
        } else {
          const response = await fetchWishlist();
          if (response.length === 0) {
            const newList = await createList();
            lid = newList.lid;
            return updateList(productId, variantId, productUrl, lid);
          } else {
            lid = response[0].lid || lid;
            return updateList(productId, variantId, productUrl, lid);
          }
        }
      }
    );
  }

  async function removeFromWishlist(productId, variantId, productUrl, listId, options = { cache: CacheLong() }) {
    return withCache(
      ['swym', 'removeFromWishlist', productId, variantId],
      options.cache,
      async function () {
        if (!session.get(REG_ID)) {
          await generateRegId();  // Call generateRegId instead of callGenrateRegidAPI
          return removeFromWishlist(productId, variantId, productUrl, listId);
        }
  
        const urlencoded = new URLSearchParams();
        urlencoded.append('regid', session.get(REG_ID));
        urlencoded.append('sessionid', session.get(SESSION_ID));
        urlencoded.append('lid', listId);
        urlencoded.append(
          'd',
          `[{ "epi":${variantId}, "empi": ${productId}, "du":"${productUrl}"}]`,
        );
  
        const response = await fetch(
          `${SWYM_CONFIG.SWYM_ENDPOINT}/api/v3/lists/update-ctx?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: urlencoded,
          }
        );
  
        if (!response.ok) {
          throw new Error('Failed to remove item from wishlist');
        }
  
        return await response.json();
      }
    );
  }
  

  
  async function fetchWishlist(options = { cache: CacheLong() }) {
    return withCache(
      ['swym', 'fetchWishlist'],
      options.cache,
      async function () {
        if (!session.get(REG_ID)) {
          await generateRegId();  // Call generateRegId instead of callGenrateRegidAPI
          return fetchWishlist();
        }
        var urlencoded = new URLSearchParams();
        urlencoded.append('regid', session.get(REG_ID));
        urlencoded.append('sessionid', session.get(SESSION_ID));

        const swymApiEndpoint = `${SWYM_CONFIG.SWYM_ENDPOINT}/api/v3/lists/fetch-lists?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;

        try {
          // Make a POST request to the Swym API
          const response = await fetch(swymApiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: urlencoded,
          });

          // Error handling for the API request
          if (!response.ok) {
            console.log(response.statusText);
            throw new Error("Failed to load wishlist");
          }

          // Parse the API response as JSON
          const data = await response.json();
          return data;
        } catch (error) {
          return json({ error: error.message }, { status: 500 });
        }
      },
    );
  }

  async function fetchListWithContents(lid, options = { cache: CacheLong() }) {
    return withCache(
      ['swym', 'fetchListWithContents', lid],
      options.cache,
      async function () {
        if (!session.get(REG_ID)) {
          await generateRegId();  // Call generateRegId instead of callGenrateRegidAPI
          return fetchListWithContents(lid);
        }
  
        const urlencoded = new URLSearchParams();
        urlencoded.append('regid', session.get(REG_ID));
        urlencoded.append('sessionid', session.get(SESSION_ID));
        urlencoded.append('lid', lid);
  
        const response = await fetch(
          `${SWYM_CONFIG.SWYM_ENDPOINT}/api/v3/lists/fetch-list-with-contents?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: urlencoded,
          }
        );
  
        if (!response.ok) {
          throw new Error('Failed to fetch list contents');
        }
  
        return await response.json();
      }
    );
  }
  

  async function guestValidateSync(useremail, options = { cache: CacheNone() }) {
    return withCache(
      ['swym', request.url],
      options.cache,
      async function () {
        
        if (!session.get(REG_ID)) {
          await generateRegId();  // Call generateRegId instead of callGenrateRegidAPI
          return guestValidateSync(useremail);
        }

        const urlencoded = new URLSearchParams();
        urlencoded.append('regid', session.get(REG_ID));
        urlencoded.append('useremail', useremail);
        urlencoded.append('useragenttype',  "mobileApp");
      

        const swymApiEndpoint = `${SWYM_CONFIG.SWYM_ENDPOINT}/storeadmin/v3/user/guest-validate-sync`;
        const apiKey = SWYM_CONFIG.REST_API_KEY;
        const pid = SWYM_CONFIG.PID;

        // Base64 encoding of pid:apiKey
        const encodedCredentials = btoa(`${pid}:${apiKey}`);

        try{
            // Make the API request to generate regid
            const response = await fetch(swymApiEndpoint, {
              method: "POST",
              headers: {
                  "Authorization": `Basic ${encodedCredentials}`,
                  "Content-Type": "application/x-www-form-urlencoded",
              },
              body: urlencoded,
            });

            // Check if the request was successful
            if (!response.ok) {
            throw new Error("Failed to sync");
            }

            // Parse the response
            const data = await response.json();
            session.set(REG_ID, data.regid);
            return data;
        }catch (error) {
            return json({ error: error.message }, { status: 500 });
        }
      },
    );
  }
  
  return { generateRegId, createList, updateList, addToWishlist, removeFromWishlist, fetchWishlist, fetchListWithContents, guestValidateSync };
}