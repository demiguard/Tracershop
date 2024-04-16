# Frontend

This is the frontend of tracershop. It's a react javascript app build with
react-bootstrap.

Commands:

`npm run dev` - Development mode
`npm run build` - Development mode
`npm run test` - Test the entire the application
`npm run test $TestName` - Test all files containing the TestName regex

## Important Ideas

The react app have a three contexts:

* TracershopState - This is a view of the database, and most of the site depend
on it. So if you update it, expect the entire site to refresh
* Dispatcher
* websocket
