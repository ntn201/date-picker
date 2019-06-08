import firebase from "firebase";
import shortid from 'shortid';

// firebase.constructor.prototype.putFiles = 

const signIn = async (email, password) => await firebase.auth().signInWithEmailAndPassword(email, password);

const putFiles = (files) => {
  var ref = firebase.storage().ref();
  return Promise.all(
    Object.values(files).map(function (file) {
      return ref
        .child(`${shortid.generate()}-${file.name}`)
        .put(file)
        .then((r) => r.ref.getDownloadURL());
    }),
  );
};

const init = (config) => firebase.initializeApp(config);

// var config = {
//   apiKey: "AIzaSyBPYNsWiUMyahGHOQXNKGZYRAD8k1DGiNQ",
//   authDomain: "camp-2019.firebaseapp.com",
//   databaseURL: "https://camp-2019.firebaseio.com",
//   projectId: "camp-2019",
//   storageBucket: "camp-2019.appspot.com",
//   messagingSenderId: "580757596336"
// };

// firebase.initializeApp(config);


const collection = (collectionName) => {
  const db = firebase.firestore();
  const firebaseCollection = db.collection(collectionName);
  const getAll = async () => {
    const data = [];
    const query = await firebaseCollection.get();
    query.forEach(doc => {
      const snapshot = doc.data()
      snapshot._id = doc.id
      data.push(snapshot);
    });
    return data;
  }

  

  const count = async (res) => {
    const r = await res.get();
    return r.docs.length;
  }
  
  const paginate = async (pageNumber, perPage, query, populate="") => {
    const data = [];
    const queryValue = [];
    let res = firebaseCollection;

    for (let key in query) {
      res = res.orderBy(key);
      queryValue.push(query[key]);
    }

    if(queryValue.length > 0) {
      res = res
        .startAt(...queryValue)
        .endAt(...queryValue)
    }

    const total = await count(res)

    res = await res
      .limit(perPage*pageNumber)
      .get();

    let i = 0;
    res.forEach(doc => {
      if (i >= (pageNumber - 1) * perPage) {
        const snapshot = doc.data();
        snapshot._id = doc.id;
        data.push(snapshot);
      }
      i += 1;
    });
    if (populate) {
      for(let i=0; i < data.length; i++) {
        if (data[i].userRef) {
          const user = await data[i].userRef.get()
          data[i].userRef = user.data();
        }
      }
    }
    return {data, total}
  }

  const getOne = async (_id) => {
    let data;
    await firebaseCollection.doc(_id).get().then(query => {
      data = { ...query.data(), _id: query.id }
    });
    return data
  }

  const getOneAndPopulate = (_id, populatePath) => {
    return new Promise(async (resolve, reject) => {
      let data = await this.getOne(_id);
      if(data[populatePath]) {
        const child = await data[populatePath].get();
        data[populatePath] = child.data();
      }
      resolve(data);
    });
  }

  const save = (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        await firebaseCollection.doc().set(data);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }

  const saveWithId = (_id, data) => {
    return new Promise(async (resolve, reject) => {
      try {
        await firebaseCollection.doc(_id).set(data);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }
  return {
    getAll,
    getOne,
    getOneAndPopulate,
    paginate,
    save,
    saveWithId,
    putFiles,
  };
};

const mxFirebase = {
  init,
  signIn,
  putFiles,
  collection,
};

const openModal = (modal, overlay) => {
  overlay.classList.add('is-open');
  modal.classList.add('is-open');
};

const closeModal = (modal, overlay) => {
  overlay.classList.remove('is-open');
  modal.classList.remove('is-open');
};

const initModal = modal => {
  if (!modal) {
    console.error("You need to provide `modal element`");
  } else {
    let overlay = document.createElement('div');
    overlay.className = 'mx-modal-overlay';
    document.body.appendChild(overlay);
    const open = () => openModal(modal, overlay);
    const close = () => closeModal(modal, overlay);
    overlay.addEventListener('click', close);
    return {
      open,
      close,
    };
  }
};

function waitFor(seconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}

const initImgUpload = () => {
  document.querySelectorAll('.mx-img-upload').forEach(elem => {
    const preview = document.createElement('img');
    preview.classList.add('mx-img-preview');
    const input = document.createElement('input');
    input.type = 'file';
    input.classList.add('mx-input-file');
    elem.appendChild(preview);
    elem.appendChild(input);
    input.addEventListener('change', event => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();

        reader.onloadend = () => {
          preview.src = reader.result;
          preview.style.display = 'block';
        }

        reader.readAsDataURL(file);
      } else {
        preview.src = "";
        preview.style.display = 'none';
      }
    });
  });
}

export {
  mxFirebase,
  initModal,
  openModal,
  closeModal,
  waitFor,
  initImgUpload
};
