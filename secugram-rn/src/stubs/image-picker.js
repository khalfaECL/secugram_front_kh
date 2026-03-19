export const launchImageLibrary = async (options, callback) => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) { resolve({ didCancel: true }); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1];
        const asset = {
          uri: ev.target.result,
          base64,
          fileName: file.name,
          type: file.type,
          fileSize: file.size,
        };
        resolve({ assets: [asset] });
      };
      reader.readAsDataURL(file);
    };
    input.oncancel = () => resolve({ didCancel: true });
    input.click();
  });
};

export const launchCamera = async () => ({ didCancel: true });
