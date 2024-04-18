"use client";

import dynamic from 'next/dynamic';
import Head from 'next/head';

const Terminal = dynamic(
  () => import('../public/Terminal'),
  { ssr: false }
);

export default function Home() {
  return (
    <>
    <Head>
    <title>LOOMQUEST</title>
      <link
        href="https://unpkg.com/jquery.terminal@2.x.x/css/jquery.terminal.min.css"
        rel="stylesheet"
      />
    </Head>
      <body>
        <Terminal />
      </body>
    </>
  );
}