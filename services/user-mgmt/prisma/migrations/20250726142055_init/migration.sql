/*
  Warnings:

  - A unique constraint covering the columns `[receiver_id,requester_id]` on the table `friendships` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "friendships_receiver_id_requester_id_key" ON "friendships"("receiver_id", "requester_id");
