import React from 'react'
import { TracerShop } from "./sites/tracer_shop.js";
import { TracerShopContext } from "./tracer_shop_context.js";

export { App }

export default function App() {
  return (
    <TracerShopContext>
      <TracerShop/>
    </TracerShopContext>);
  }

