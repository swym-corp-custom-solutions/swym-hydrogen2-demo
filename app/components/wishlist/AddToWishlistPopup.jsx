import { useContext, useEffect, useState } from 'react';
import './AddToWishlistPopup.css';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { getWishlistBadgeLetters } from '~/lib/swym/Utils/utilsFunction';
import SWYM_CONFIG from '~/lib/swym/swymconfig';

export function validateString(name, errorsObj) {
    if (!name) {
        return errorsObj.empty;
    }
    if (name.length < 3) {
        return errorsObj.minLength;
    }
    if (name.length > 50) {
        return errorsObj.maxLength;
    }
}

export const validateUniqueString = (newList, previousListArr, errorStr) => {
    if (previousListArr.indexOf(newList) !== -1) {
        return errorStr;
    }
};

function Loader({ showLoading, width = 30 }) {
    return (
        <>
            {showLoading &&
                <div className='swym-hl-modal-loader'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width={width}><radialGradient id="a12" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)"><stop offset="0" stopColor="currentColor"></stop><stop offset=".3" stopColor="currentColor" stopOpacity=".9"></stop><stop offset=".6" stopColor="currentColor" stopOpacity=".6"></stop><stop offset=".8" stopColor="currentColor" stopOpacity=".3"></stop><stop offset="1" stopColor="currentColor" stopOpacity="0"></stop></radialGradient><circle transform-origin="center" fill="none" stroke="url(#a12)" strokeWidth="15" strokeLinecap="round" strokeDasharray="200 1000" strokeDashoffset="0" cx="100" cy="100" r="70"><animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform></circle><circle transform-origin="center" fill="none" opacity=".2" stroke="currentColor" strokeWidth="15" strokeLinecap="round" cx="100" cy="100" r="70"></circle></svg>
                </div>
            }
        </>
    )
}

function WishlistNameItem({ name, index, id, selectedListId, onSetSelectedListId }) {
    const [isSelected, setIsSelected] = useState(false);
    const [selectBackground, setSelectBackground] = useState(false);
    const className = 'swym-wishlist-item swym-value swym-is-button swym-color-2 swym-hover-color-1';
    const letters = getWishlistBadgeLetters(name, 'MW');

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSelected((prev) => !prev);
        setSelectBackground((prev) => !prev);
        onSetSelectedListId(id);
    };

    return (
        <div role="radiogroup">
            <button
                name="wishlist-options"
                className={className}
                onClick={(e) => {
                    handleClick(e);
                }}
                role="radio"
                aria-checked={isSelected}
                aria-label={name}
                style={{
                    borderBottom: '1px solid #CACBCF',
                    paddingLeft: 0,
                }}
            >
                <span className="swym-wishlist-badge swym-hl-bg-color swym-hl-text-color">
                    {letters}
                </span>
                <label
                    htmlFor={id}
                    className="swym-wishlist-text"
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}
                >
                    <span className="swym-wishlist-name">{name}</span>
                </label>
                <span className='swym-wishlist-radio'>
                    {' '}
                    <input
                        type="radio"
                        checked={id === selectedListId}
                        id={id}
                        className={`${id === selectedListId ? 'selected-list-id' : ''}`}
                        style={{ accentColor: '#035587', color: '#035587' }}
                        onChange={() => onSetSelectedListId(id)}
                    />{' '}
                </span>
            </button>
        </div>
    );
}

export default function AddToWishlistPopup({ title, productId, variantId, productUrl, image, onPopupToggle, setshowAlertBox, setalertBox, onAddedToWishlist }) {
    const createWishlistFetcher = useFetcher();
    const addToWishlistFetcher = useFetcher();
    const { wishlist } = useLoaderData();
    const [showCreateNewList, setshowCreateNewList] = useState(false);
    const [showLoading, setshowLoading] = useState(false);
    const [showListLoading, setshowListLoading] = useState(false);
    const [customListName, setcustomListName] = useState('');
    const [wishlistName, setWishlistName] = useState('');
    const [selectedListId, setSelectedListId] = useState('');
    const [error, setError] = useState();

    useEffect(() => {
        if(!wishlist || wishlist.length == 0){
            createNewList();
        }else{
            setSelectedListId(wishlist[0].lid)
        }
    }, [])

    useEffect(() => {
        let createdListData = createWishlistFetcher.data;
        if(createdListData && createdListData.data){
            setSelectedListId(createdListData.data.lid);
            setWishlistName('')
            hideCreateNewList();
        }
    }, [createWishlistFetcher.data]);

    useEffect(() => {
        if(addToWishlistFetcher.data){
            onPopupToggle(false);
            onAddedToWishlist();
        }
    }, [addToWishlistFetcher.data]);

    const handleCreateWishlist = async () => {
        if (!wishlistName) {
            setError('Please enter a wishlist name.');
            return;
        }

        createWishlistFetcher.submit(
            {
                _action: 'create',
                wishlistName
            },
            { method: 'post', action: '/wishlist/api/create' }
        );

    };

    const handleAddToWishlist = async () => {
        if (!selectedListId) {
            setError('Please select a wishlist.');
            return;
        }

        addToWishlistFetcher.submit(
            {
                productId,
                variantId,
                productUrl,
                listId: selectedListId,
            },
            { method: 'post', action: '/wishlist/api/add' }
        );
    };



    const handleOptionChange = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setSelectedListId(event.target.value);
    };

    const createNewList = () => {
        setshowCreateNewList(true);
    }

    const hideCreateNewList = () => {
        setshowCreateNewList(false);
    }

    function validateWishlistName(name) {
        let wishlists = [];
        {
            wishlist &&
                wishlist.length > 0 &&
                wishlist.map((list) => {
                    wishlists.push(list);
                });
        }
        let validateStringVar = validateString(name, {
            empty: 'Must provide a list name',
            minLength: 'Name must be longer than 3 characters',
            maxLength: 'Name must be less than 50 characters long',
        });
        let validateUniqueStringVar = validateUniqueString(
            name,
            wishlists.map((list) => {
                return list.lname;
            }),
            'List name already exists',
        );
        return validateStringVar || validateUniqueStringVar;
    }

    function validateAndSetListName(value) {
        setWishlistName(value);
        setError(validateWishlistName(value));
        console.log(error);
    }

    return (
        <div id="swym-hl-add-to-list-popup" className="modal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPopupToggle(false) }}>
            <div className="swym-hl-modal-content" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <span className="swym-hl-modal-close-btn" onClick={() => onPopupToggle(false)}>&times;</span>
                <div className="swym-hl-product-title">
                    <div className="swym-hl-product-image">
                        <img src={image} alt="" />
                    </div>
                    <h3 className="swym-product-name swym-heading swym-heading-1 swym-title-new">{title}</h3>
                </div>
                <div className="swym-hl-product-content">
                    {showCreateNewList && (
                        <div>
                            <div className="swym-hl-new-wishlist-item swym-hl-new-wishlist-input-container">
                                <input
                                    type="text"
                                    className={`swym-new-wishlist-name swym-no-zoom-fix swym-input ${error ? 'swym-input-has-error' : ''}`}
                                    onChange={(e) => {
                                        validateAndSetListName(e.target.value);
                                    }}
                                    placeholder="Enter Wishlist Name"
                                    value={wishlistName}
                                />
                                <span className="error-msg" role="alert">
                                    {error}
                                </span>
                            </div>
                            <div className='swym-hl-modal-action'>
                                <div className='swym-hl-bg-outline swym-hl-modal-action-btn' onClick={hideCreateNewList} >cancel</div>
                                <div className='swym-hl-bg-color swym-hl-modal-action-btn swym-hl-text-color' onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCreateWishlist() }}> <Loader width={20} showLoading={showLoading} /> Create</div>
                            </div>
                        </div>
                    )}
                    {!showCreateNewList && (
                        <div>
                            <div className="swym-wishlist-items">
                                <div className="swym-wishlist-items-title" role="radiogroup">Add To List</div>
                                {(!wishlist || !wishlist.length) && <Loader showLoading={showListLoading} />}
                                {wishlist && wishlist.length > 0 && wishlist.map(({ lname, lid }, index) => {
                                    return (
                                        <WishlistNameItem
                                            key={lid}
                                            name={lname}
                                            id={lid}
                                            index={index}
                                            selectedListId={selectedListId}
                                            onSetSelectedListId={setSelectedListId}
                                        />
                                    );
                                })}
                            </div>
                            <div className='swym-hl-modal-action'>
                                <div className='swym-hl-bg-outline swym-hl-modal-action-btn' onClick={createNewList} >Create New List</div>
                                <div className='swym-hl-bg-color swym-hl-modal-action-btn swym-hl-text-color' onClick={() => handleAddToWishlist()}> <Loader width={20} showLoading={showLoading} /> Add To List</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}