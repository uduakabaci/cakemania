import { useEffect, useState } from "react";
import Cropper from "cropperjs";

export default function ImagePreview() {
  const [image, setImage] = useState<{ base64: string; raw: any }>();
  const [settings, setSettings] = useState<{
    left: number;
    top: number;
    height: number;
    width: number;
  }>();

  const [cCropper, setCCropper] = useState<Cropper>();

  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImage({
          base64: reader.result?.toString() || "",
          raw: e.target.files?.[0],
        });
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  useEffect(() => {
    let cropper: any = null;
    if (image) {
      cropper = new Cropper(
        document.getElementById("image") as HTMLImageElement,
        {
          minCropBoxHeight: 300,
          viewMode: 3,
          aspectRatio: 1 / 1.7,
          crop(event: any) {
            setSettings({
              left: event.detail.x,
              top: event.detail.y,
              height: event.detail.height,
              width: event.detail.width,
            });
          },
        }
      );
      setCCropper(cropper);
    }
    return () => {
      if (cropper) {
        setCCropper(undefined);
        cropper.destroy();
      }
    };
  }, [image]);

  function download(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    // the filename you want
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  const handleSubmit = async () => {
    // get the image here
    const blob: Blob = await new Promise((resolve) => {
      cCropper
        ?.getCroppedCanvas({
          maxWidth: settings?.width,
          maxHeight: settings?.height,
        })
        .toBlob((blob) => {
          if (blob) resolve(blob);
        });
    });

    const formdata = new FormData();
    formdata.append("name", name.toLocaleUpperCase());
    formdata.append("image", blob);
    formdata.append("settings", JSON.stringify(settings));

    setLoading(true);

    fetch("/api/generate-image", {
      method: "POST",
      body: formdata,
    })
      .then((data) => {
        return data?.blob();
      })
      .then((blob) => {
        download(blob, image?.raw.name);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="w-full max-w-[600px] mx-auto p-4 my-4 space-y-4">
      <input
        type="file"
        id="file"
        className="hidden"
        onChange={onSelectFile}
        itemType="*/image"
      />
      {!image && (
        <label
          className="border-2 border-dashed border-gray-400 h-[200px] w-full  rounded-lg mx-auto flex items-center justify-center padding text-center cursor-pointer"
          htmlFor="file"
        >
          Click here to upload image
        </label>
      )}
      {image && (
        <div className="mx-auto">
          <label
            htmlFor="file"
            className="bg-blue-500 py-2 px-4 rounded-lg text-center text-white cursor-pointer inline-block mb-2"
          >
            Change image
          </label>
          <div className="relative">
            <img src={image?.base64} id="image" className="block w-full" />
            <p className="pt-1 text-gray-500 text-sm">
              Move outline to crop the image to fit.
            </p>
          </div>
        </div>
      )}
      <div>
        <p className="mb-2">Enter name</p>
        <input
          type="text"
          className="py-3 px-4 border border-gray-300 rounded-lg w-full outline-none"
          defaultValue={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        {loading ? (
          <p>Processing Image...</p>
        ) : (
          name &&
          image?.raw && (
            <button
              className="bg-blue-500 active:bg-blue-700  py-3 px-4 rounded-lg text-center text-white cursor-pointer"
              onClick={handleSubmit}
            >
              Generate
            </button>
          )
        )}
      </div>
    </div>
  );
}
