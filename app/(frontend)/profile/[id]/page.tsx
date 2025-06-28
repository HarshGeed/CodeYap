'use client'
import default_pfp from "@/public/default_pfp.jpg";
import Image from "next/image";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React from "react";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const profileUserId = React.use(params);
  const loggedInUserId = session?.user?.id;

  const isOwnProfile = loggedInUserId === profileUserId;

  return (
    <div className="mx-[11rem] mt-10 mb-6">
      <div className="grid grid-cols-[1fr_2fr] gap-8">
        <div>
          {/* Profile Image */}
          <div className="h-[13rem] w-[13rem] bg-[#41403e] rounded-full relative">
            <Image
              src={default_pfp}
              alt="Profile pic"
              fill
              style={{ objectFit: "cover", borderRadius: "9999px" }}
            />
          </div>
          <div className="mt-6">
            <p className="font-medium text-2xl">Username</p>
            <p className="text-sm opacity-80">harshgeed07@gmail.com</p>

            {/* if user is viewing then edit profile button else connect button  */}
            {isOwnProfile ? (
              <button className="p-2 rounded-xl bg-blue-700 text-white mt-4 w-full">
                Edit Profile
              </button>
            ) : (
              <button className="p-2 rounded-xl bg-green-700 text-white mt-4 w-full">
                Connect
              </button>
            )}

            <p className="mt-5">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Cum at
              odit iste hic. Obcaecati, commodi illum saepe veniam a, recusandae
              voluptatum, dignissimos laborum reiciendis magnam labore
              blanditiis? Iste laboriosam totam corporis! Molestiae assumenda
              eius rerum iste ipsam cupiditate eveniet nesciunt accusantium,
              ratione aliquam recusandae nihil maiores eaque quae, deleniti
              repellat?
            </p>
            <div className="flex mt-4 opacity-80">
              <MapPin />
              <p className="ml-2">Bhopal, Madhya Pradesh, India</p>
            </div>
            <Link href="#">
              <button className="p-2 rounded-xl bg-blue-950 mt-3 w-full">
                LinkedIn
              </button>
            </Link>
            <Link href="#">
              <button className="p-2 rounded-xl bg-gray-800 mt-3 w-full">
                Github
              </button>
            </Link>
          </div>
        </div>
        {/* 2nd grid */}
        <div>
            <h1 className="text-3xl font-semibold">🤵 About Me :</h1>
            <hr className="mt-4 opacity-50"/>
            <p className="mt-5">Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt magni quod error saepe! Sunt harum nulla modi aliquid repellat assumenda, veniam incidunt debitis, inventore eum in explicabo. Sapiente sequi esse ducimus quos cum laudantium voluptatibus autem aut debitis, incidunt asperiores at error veritatis adipisci aspernatur earum officia quia commodi, dolorum odio facere corporis voluptate? Porro eaque officiis nemo adipisci, libero inventore in sint quas sapiente molestias, accusantium aspernatur animi neque odio eligendi corrupti impedit. Animi itaque, quam quia dolores corporis quaerat quis quae at delectus neque modi fugit. Ipsum nam tempore aperiam voluptate? At debitis autem suscipit saepe dolor, consequuntur qui quos obcaecati veniam ducimus hic, aperiam consequatur odio. Officia cum aspernatur laborum inventore quas voluptas repudiandae distinctio quasi itaque vel, atque hic perferendis, repellat ut magni pariatur fuga. Deleniti, repudiandae, vel minima unde quas odit sint sit aliquam, veritatis aut sapiente modi. Praesentium, nesciunt ab deleniti totam rerum enim ullam impedit illo dolorem reprehenderit soluta, nostrum iste, laudantium similique consequatur eius magni. Unde dolorum odit assumenda facere in beatae cumque nam corrupti mollitia vero dolor hic odio blanditiis eum a quod eius sint, aliquid accusamus, repellat rem? Commodi minus molestiae in sed. Id itaque ducimus, dolorum facere perspiciatis eveniet.</p>

            <h1 className="text-3xl font-semibold mt-5">💻 Tech Stacks :</h1>
            
            <hr className="mt-4 opacity-50"/>
            <p className="mt-5">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Deserunt aperiam dolorum corporis maxime quod commodi sequi asperiores consequatur velit, sunt neque ratione omnis suscipit vero culpa quam delectus iste? Fuga repudiandae obcaecati saepe incidunt maiores iure dolorum officia, enim perferendis quo quia ipsam error pariatur quos labore temporibus suscipit non!</p>

        </div>
      </div>
    </div>
  );
}
