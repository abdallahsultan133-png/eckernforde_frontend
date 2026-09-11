import {EditView} from "@/components/refine-ui/views/edit-view.tsx";
import {PageHeader} from "@/components/layout/page-header.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useBack, useGetIdentity, useList} from "@refinedev/core";
import {useParams} from "react-router";
import {useEffect} from "react";
import {Separator} from "@/components/ui/separator.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "@refinedev/react-hook-form"
import type { ControllerRenderProps } from "react-hook-form";
import {classSchema} from "@/lib/schema.ts";
import * as z from "zod";

type ClassFormValues = z.infer<typeof classSchema>;
type UploadedFile = { url: string; publicId: string } | null;

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Loader2} from "lucide-react";
import UploadWidget from "@/components/upload-widget.tsx";
import {Subject, User, UserRole} from "@/types";

const Edit = () => {
    const back = useBack();
    const { id } = useParams<{ id: string }>();
    const { data: identity } = useGetIdentity<User>();
    const isTeacher = identity?.role === UserRole.TEACHER;
    const isAdmin = identity?.role === UserRole.ADMIN || identity?.role === UserRole.SUPER_ADMIN;

    const form = useForm({
        resolver: zodResolver(classSchema),
        refineCoreProps: {
            resource: "classes",
            action: "edit",
            id,
        }
    });

    const {
        refineCore: { onFinish, query },
        handleSubmit,
        formState: { isSubmitting, errors },
        control,
    } = form;

    const isLoadingRecord = query?.isLoading;

    // bannerCldPubId has no visible <FormField> of its own (it's set alongside
    // bannerUrl inside setBannerImage below), so react-hook-form never
    // "registers" it and the record→form auto-sync silently skips it — every
    // save then fails validation with "Banner reference is required" even
    // though the banner image itself displays correctly. Sync it explicitly.
    useEffect(() => {
        const record = query?.data?.data as { bannerCldPubId?: string } | undefined;
        if (record?.bannerCldPubId) {
            form.setValue("bannerCldPubId", record.bannerCldPubId, { shouldValidate: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query?.data?.data]);

    const onSubmit = async (values: z.infer<typeof classSchema>) => {
        try {
            await onFinish(values);
            back();
        } catch (error) {
            console.error("Error updating class:", error);
        }
    };

    const { query: subjectsQuery } = useList<Subject>({
        resource: 'subjects',
        pagination: { pageSize: 100 }
    })

    const { query: teachersQuery } = useList<User>({
        resource: 'users',
        filters: [
            { field: 'role', operator: 'eq', value: 'teacher' },
        ],
        pagination: { pageSize: 100 },
        queryOptions: {
            enabled: !isTeacher,
        },
    })

    const subjects = subjectsQuery?.data?.data || [];
    const subjectsLoading = subjectsQuery.isLoading;

    const teachers = teachersQuery?.data?.data || [];
    const teachersLoading = teachersQuery.isLoading

    const bannerPublicId = form.watch('bannerCldPubId');

    const setBannerImage = (file: UploadedFile, field: ControllerRenderProps<ClassFormValues, "bannerUrl">) => {
        if(file) {
            field.onChange(file.url);
            form.setValue('bannerCldPubId', file.publicId, {
                shouldValidate: true,
                shouldDirty: true,
            })
        } else {
            field.onChange('');
            form.setValue('bannerCldPubId', '', {
                shouldValidate: true,
                shouldDirty: true,
            })
        }
    }

    return (
        <EditView className="class-view">
            <PageHeader
                breadcrumb
                title="Edit Class"
                description="Update the details for this class."
                actions={<Button variant="outline" onClick={() => back()}>Go Back</Button>}
            />

            <Separator />

            <div className="my-4 flex items-center">
                <Card className="class-form-card">
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-2xl pb-0 font-bold text-gradient-orange">
                            Fill out form
                        </CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="mt-7">
                        <Form {...form}>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={control}
                                    name="bannerUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Banner Image <span className="text-orange-600">*</span></FormLabel>
                                            <FormControl>
                                                <UploadWidget
                                                    value={field.value ? { url:  field.value, publicId: bannerPublicId ?? ''} : null}
                                                    onChange={(file) => setBannerImage(file, field)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            {errors.bannerCldPubId && !errors.bannerUrl && (
                                                <p className="text-destructive text-sm">{errors.bannerCldPubId.message?.toString()}</p>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Class Name <span className="text-orange-600">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Introduction to Biology - Section A"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={control}
                                        name="subjectId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Subject <span className="text-orange-600">*</span>
                                                </FormLabel>
                                                <Select
                                                    // Remounts once the class record's subjectId is known and the
                                                    // subjects list has loaded — otherwise Radix can permanently miss
                                                    // the pre-set value's label if it mounted before either was ready.
                                                    key={`${field.value ?? "unset"}-${subjectsLoading}`}
                                                    onValueChange={(value) =>
                                                        field.onChange(Number(value))
                                                    }
                                                    value={field.value?.toString()}
                                                    disabled={subjectsLoading}

                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select a subject" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {subjects.map((subject) => (
                                                            <SelectItem
                                                                key={subject.id}
                                                                value={subject.id.toString()}
                                                            >
                                                                {subject.name} ({subject.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="teacherId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Teacher <span className="text-orange-600">*</span>
                                                </FormLabel>
                                                {isTeacher ? (
                                                    <FormControl>
                                                        <Input value={identity?.name ?? "You"} disabled readOnly />
                                                    </FormControl>
                                                ) : (
                                                    <Select
                                                        key={`${field.value ?? "unset"}-${teachersLoading}`}
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={teachersLoading}

                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select a teacher" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {teachers.map((teacher) => (
                                                                <SelectItem
                                                                    key={teacher.id}
                                                                    value={teacher.id.toString()}
                                                                >
                                                                    {teacher.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={control}
                                        name="capacity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Capacity</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="30"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value ? Number(value) : undefined);
                                                        }}
                                                        value={(field.value as number | undefined) ?? ""}
                                                        name={field.name}
                                                        ref={field.ref}
                                                        onBlur={field.onBlur}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Status <span className="text-orange-600">*</span>
                                                </FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {isAdmin && <FormField
                                        control={control}
                                        name="schoolLevel"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>School level <span className="text-orange-600">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Classify for formal results" /></SelectTrigger></FormControl>
                                                    <SelectContent><SelectItem value="nursery">Nursery / Kindergarten</SelectItem><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem></SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />}
                                </div>

                                <FormField
                                    control={control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Brief description about the class"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full"
                                    disabled={isSubmitting || isLoadingRecord}
                                >
                                    {isSubmitting ? (
                                        <div className="flex gap-1">
                                            <span>Saving Changes...</span>
                                            <Loader2 className="inline-block ml-2 animate-spin" />
                                        </div>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </EditView>
    );
};

export default Edit;
