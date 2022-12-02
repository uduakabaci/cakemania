import { useEffect, useState } from "react";
import Cropper from "cropperjs";

const sessionKey = "ticket";

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
  const [ticket, setTicket] = useState(null);
  const [ticketID, setTicketID] = useState("");

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
    const sessionData = sessionStorage.getItem(sessionKey);
    setTicket(JSON.parse(sessionData || "null"));
  }, []);

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
    formdata.append("name", name);
    formdata.append("image", blob);
    formdata.append("settings", JSON.stringify(settings));
    formdata.append("ticket", JSON.stringify(ticket) || "");

    setLoading(true);

    fetch("/api/generate-image", {
      method: "POST",
      body: formdata,
    })
      .then((data) => {
        if (data.status != 200) throw Error(data.statusText);
        return data?.blob();
      })
      .then((blob) => {
        download(blob, image?.raw.name);
      })
      .catch(() => {
        alert("Could not generate your image at the moment. Try again later.");
      })
      .finally(() => setLoading(false));
  };

  // 464333901;

  const fetchPaymentDetails = async () => {
    // fetch
    if (!ticketID) return;
    setLoading(true);
    fetch(`https://api.cakemaniashow.com/ticket_id/${ticketID}`)
      .then((response) => response.json())
      .then((body) => {
        if (!/success/gi.test(body.status)) {
          alert("This ticket ID is invalid!");
        } else {
          sessionStorage.setItem(sessionKey, JSON.stringify(body));
          setTicket(body);
        }
      })
      .catch((err) => console.log(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <>
      {!ticket && (
        <div className="fixed h-full w-full bg-white top-0 grid items-center z-20">
          <div className="w-full max-w-[600px] mx-auto p-4">
            <div>
              <p className="mb-2 uppercase text-sm text-gray-600">
                Input ticket ID
              </p>
              <input
                type="text"
                className="py-3 px-4 border border-gray-300 rounded-lg w-full outline-none"
                defaultValue={ticketID}
                onChange={(e) => setTicketID(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-justify">
              This service is for those who bought ticket for the event. Please
              Provide a valid ticket ID to continue.
            </p>
            <div className="mt-2">
              {loading ? (
                <p>Processing...</p>
              ) : (
                <button
                  className="bg-[#2a07f9]  py-3 px-4 rounded-lg text-center cursor-pointer inline-block w-full uppercase text-sm text-white"
                  onClick={fetchPaymentDetails}
                >
                  Confirm Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-[600px] mx-auto p-4 my-4 space-y-4 relative">
        <h1 className="uppercase font-semibold">Image Generator</h1>
        <img
          src="/images/logo.png"
          alt="logo"
          className="w-[50px] absolute right-4 top-[-20px] z-50"
        />
        <input
          type="file"
          id="file"
          className="hidden"
          onChange={onSelectFile}
          itemType="*/image"
        />
        {!image && (
          <label
            className="border-2 border-dashed border-gray-400 h-[200px] w-full  rounded-lg mx-auto flex items-center justify-center padding text-center cursor-pointer uppercase text-sm text-gray-700"
            htmlFor="file"
          >
            Click here to upload image
          </label>
        )}
        {image && (
          <div className="mx-auto">
            <label
              htmlFor="file"
              className="bg-orange-500 py-2 px-4 rounded-lg text-center text-white cursor-pointer inline-block mb-2 uppercase text-sm"
            >
              Change image
            </label>
            <div className="relative">
              <img src={image?.base64} id="image" className="block w-full" />
              <p className="pt-1 text-gray-500 text-sm">
                Move the outline to crop the image to fit.
              </p>
            </div>
          </div>
        )}
        <div>
          <p className="mb-2 text-sm text-gray-600">
            <span className="uppercase">Name</span>
            <span> (As you want on the confirm)</span>
          </p>
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
                className="bg-[#2a07f9]  py-3 px-4 rounded-lg text-center cursor-pointer w-full text-sm uppercase text-white"
                onClick={handleSubmit}
              >
                Generate
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}
