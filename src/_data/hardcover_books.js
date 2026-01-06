const HARDCOVER_BOOKS = process.env.HARDCOVER_BOOKS;

export default async function() {

    if(!HARDCOVER_BOOKS) return [];
    let req;

    let body = `
    {
    user_books(
        where: {user_id: {_eq: 65213}, status_id: {_eq: 2}}
    ) {
        book {
            title
            image {
                url
            }
            contributions {
                author {
                    name
                }
            }
        }
    }
    }
    `.trim();

    try {
        req = await fetch('https://api.hardcover.app/v1/graphql', {
            method:'POST', 
            headers: {
                'authorization':HARDCOVER_BOOKS,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({query:body})
        });
    } catch (e) {
        console.log('Hardcover API error', e);
        return [];
    }

    let data = (await req.json()).data.user_books.map(ob => ob.book);
    /* normalize authors */
    data = data.map(b => {
    b.authors = b.contributions.reduce((list,c) => {
        if(c.author) list.push(c.author.name);
        return list;
        },[]);
        return b;
    });

    return data;

    
};
