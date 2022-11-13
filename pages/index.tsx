import Head from "next/head";
import { useCallback, useEffect } from "react";

export default function Home() {
  useEffect(() => {
    fetch("/api/generate-image", { cache: "no-store" })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
      });

    return () => {};
  });

  const loadImage = useCallback(() => {
    console.log("welp");
  }, []);

  return (
    <div>
      <Head>
        <title>Image processor</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container m-auto">
        <div className="p-4 flex justify-center">
          <span
            className="inline-block py-3 px-4 bg-blue-500 m-auto rounded-full text-white cursor-pointer active:bg-blue-700 select-none"
            onClick={loadImage}
          >
            Load Image
          </span>
        </div>
      </main>
    </div>
  );
}
