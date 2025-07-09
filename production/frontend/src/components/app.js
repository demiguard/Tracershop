import React from 'react'
import { TracerShop } from "./sites/tracer_shop.js";
import { TracerShopContextInitializer } from "../contexts/tracer_shop_context.js";

export { App }

export default function App() {

  return (
    <TracerShopContextInitializer>
      <TracerShop/>
    </TracerShopContextInitializer>);
  }
