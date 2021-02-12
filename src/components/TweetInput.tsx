import React, { useState } from "react";
import styles from "./TweetInput.module.css";
import { useSelector } from "react-redux";
import { selectUser } from "../features/userSlice";
import { auth, storage, db } from "../firebase";
import { Avatar, Button, IconButton } from "@material-ui/core";
import firebase from "firebase/app";
import AddPhotoIcon from "@material-ui/icons/AddAPhoto";

const TweetInput: React.FC = () => {
  const user = useSelector(selectUser);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postMsg, setPostMsg] = useState("");

  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files![0]) {
      setPostImage(e.target.files![0]);
      e.target.value = "";
    }
  };
  //▼▼▼▼send post func▼▼▼▼
  const sendPost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (postImage) {
      //投稿したimageをstorageに保存する処理
      const S =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const N = 16;
      const randomChar = Array.from(crypto.getRandomValues(new Uint32Array(N)))
        .map((n) => S[n % S.length])
        .join("");
      const fileName = randomChar + "_" + postImage.name;
      const uploadPostImg = storage.ref(`images/${fileName}`).put(postImage);
      uploadPostImg.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        () => {},
        (err) => alert(err.message),
        async () =>
          await storage
            .ref("images")
            .child(fileName)
            .getDownloadURL()
            .then(
              async (url) =>
                await db.collection("posts").add({
                  avatar: user.photoUrl,
                  image: url,
                  text: postMsg,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                  username: user.displayName,
                })
            )
      );
    } else {
      db.collection("posts").add({
        avatar: user.photoUrl,
        image: "",
        text: postMsg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        username: user.displayName,
      });
    }
    setPostImage(null);
    setPostMsg("");
  };
  //▲▲▲▲send post func▲▲▲▲

  return (
    <>
      <form onSubmit={sendPost}>
        <div className={styles.tweet_form}>
          <Avatar
            className={styles.tweet_avatar}
            src={user.photoUrl}
            onClick={async () => {
              await auth.signOut();
            }}
          />
          <input
            className={styles.tweet_input}
            placeholder="What's happening?"
            type="text"
            autoFocus
            value={postMsg}
            onChange={(e) => setPostMsg(e.target.value)}
          />
          <IconButton>
            <label>
              <AddPhotoIcon
                className={
                  postImage ? styles.tweet_addIconLoaded : styles.tweet_addIcon
                }
              />
              <input
                className={styles.tweet_hiddenIcon}
                type="file"
                onChange={onChangeImageHandler}
              />
            </label>
          </IconButton>
        </div>
        <Button
          type="submit"
          disabled={!postMsg} //if postMsg is null, don't push send button
          className={
            postMsg ? styles.tweet_sendBtn : styles.tweet_sendDisableBtn
          }
        >
          POST
        </Button>
      </form>
    </>
  );
};

export default TweetInput;
