const properties = require('./json/properties.json');
const users = require('./json/users.json');
// const pg = require('pg');
const { Pool } = require('pg');
// const Pool = pg.Pool;

const pool = new Pool({
    user: 'vagrant',
    password: '123',
    host: 'localhost',
    database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = function(email) {

    return pool.query(`
  SELECT * FROM users
  WHERE email  = $1
  `, [email]).then(res => {
        console.log(res.rows[0]);
        return res.rows[0];
    })

    // let user;
    // for (const userId in users) {
    //     user = users[userId];
    //     if (user.email.toLowerCase() === email.toLowerCase()) {
    //         break;
    //     } else {
    //         user = null;
    //     }
    // }
    // return Promise.resolve(user);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
    return pool.query(`
  SELECT * FROM users
  WHERE id = $1
  `, [id]).then(res => {
        console.log(res.rows[0]);
        return res.rows[0];
    })

    // return Promise.resolve(users[id]);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
    const query = "INSERT INTO users(name, email, password) VALUES('$1', '$2', '$3')";
    const template_data = [users.name, users.email, users.password];
    const promise = pool.query(query, template_data);

    return promise.then(res => {
        console.log(res.rows[0]);
        return res.rows[0];
    })

    // const userId = Object.keys(users).length + 1;
    // user.id = userId;
    // users[userId] = user;
    // return Promise.resolve(user);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
    return pool.query(`
    SELECT thumbnail_photo_url,properties.id,title,start_date, end_date,cost_per_night,number_of_bathrooms,number_of_bedrooms,parking_spaces, avg(rating)::NUMERIC as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id 
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2
  `, [guest_id, limit]).then(res => {
        console.log(res.rows);
        return res.rows;
    })

    // return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

    const queryParams = [];

    let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

    let filterQuery = [];

    if (options.city) {

        queryParams.push(`%${options.city}%`);
        filterQuery.push(`city LIKE $${queryParams.length} `);
    }

    if (options.minimum_rating) {
        queryParams.push(options.minimum_rating);
        filterQuery.push(`property_reviews.rating >= $${queryParams.length}`);
    }

    if (options.minimum_price_per_night) {
        queryParams.push(options.minimum_price_per_night * 100);
        filterQuery.push(`cost_per_night >= $${queryParams.length}`);
    }

    if (options.maximum_price_per_night) {
        queryParams.push(options.maximum_price_per_night);
        filterQuery.push(`cost_per_night <= $${queryParams.length}`);
    }


    queryParams.push(limit);

    if (filterQuery.length > 0) {
        queryString += `WHERE ${filterQuery.join (' AND ')} `
    }

    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    `;

    queryString += `LIMIT $${queryParams.length}`;

    // 5
    console.log(queryString, queryParams);

    // 6
    return pool.query(queryString, queryParams)
        .then(res => {
            console.log(res.rows)
            return res.rows
        });

}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

const addProperty = function(property) {
    console.log('PROPERTY', property);
    return pool.query(`
    INSERT INTO properties (owner_id, title, description,thumbnail_photo_url, cover_photo_url,cost_per_night,street,city,province,post_code,country,parking_spaces,number_of_bathrooms,number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;
  `, [
            property.owner_id,
            property.title,
            property.description,
            property.thumbnail_photo_url,
            property.cover_photo_url,
            property.cost_per_night || 0,
            property.street,
            property.city,
            property.province,
            property.post_code,
            property.country,
            property.parking_spaces || 0,
            property.number_of_bathrooms || 0,
            property.number_of_bedrooms || 0
        ])
        .then(res => {
            console.log(res.rows)
            return res.rows
        });

}
exports.addProperty = addProperty;